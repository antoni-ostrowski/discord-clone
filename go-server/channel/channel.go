package channel

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
)

type Channel struct {
	Upgrader             *websocket.Upgrader
	Clients              map[string]*Client
	Register             chan *Client
	Unregister           chan *Client
	Broadcast            chan []byte
	trackLock            sync.RWMutex
	tracks               map[string]*webrtc.TrackLocalStaticRTP
	BroadcastNewTrackChn chan *BroadcastNewTrack
}

func NewChannel(up *websocket.Upgrader) *Channel {
	return &Channel{
		Upgrader:             up,
		Clients:              make(map[string]*Client),
		Register:             make(chan *Client),
		Unregister:           make(chan *Client),
		Broadcast:            make(chan []byte),
		tracks:               make(map[string]*webrtc.TrackLocalStaticRTP),
		BroadcastNewTrackChn: make(chan *BroadcastNewTrack),
	}
}

type BroadcastNewTrack struct {
	ClientId string
	NewTrack *webrtc.TrackLocalStaticRTP
}

type Client struct {
	Id      string
	Send    chan []byte
	Peer    *webrtc.PeerConnection
	Channel *Channel
	mu      sync.Mutex
	closed  bool
	ready   bool
}

func (c *Client) SafeSend(msg []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed {
		return
	}
	c.Send <- msg
}

func (c *Client) SignalNegotiation() {
	log.Printf("signalling negotation for %v", c.Id)
	c.mu.Lock()

	offer, err := c.Peer.CreateOffer(nil)
	if err != nil {
		log.Printf("Error creating offer for %s: %v", c.Id, err)
		return
	}

	err = c.Peer.SetLocalDescription(offer)
	if err != nil {
		log.Printf("Error setting local description for %s: %v", c.Id, err)
		return
	}

	log.Printf("Offer created for %v", c.Id)

	c.mu.Unlock()

	msg, _ := json.Marshal(map[string]any{
		"type":    "offer",
		"payload": offer.SDP,
	})
	c.SafeSend(msg)
}

type WSmsg struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func (c *Channel) Run() {
	for {
		select {
		// when user connects to the channel we register them
		// and give them existing users proxy mouths
		case client := <-c.Register:
			log.Printf(":) registering new client %v", client.Id)
			c.Clients[client.Id] = client

			log.Printf("all the clients: \n")
			for _, cl := range c.Clients {
				log.Printf("client: %v\n", cl.Id)
			}
		// user left channel
		case client := <-c.Unregister:
			if existing, ok := c.Clients[client.Id]; ok && existing == client {
				log.Printf(":( unregistering new client %v", client.Id)

				// delete clients proxy mouth
				c.trackLock.Lock()
				delete(c.tracks, client.Id)
				c.trackLock.Unlock()

				// delete client from channel
				client.mu.Lock()
				delete(c.Clients, client.Id)
				close(client.Send)
				client.closed = true
				client.mu.Unlock()

				// close peer conn, this stops the 'OnTrack' loop and cleans up Pion resources
				if client.Peer != nil {
					client.Peer.Close()
				}
			}
		case msg := <-c.Broadcast:
			log.Printf("starting broadcast loop")
			for id, client := range c.Clients {
				select {
				case client.Send <- msg:
				default:
					close(client.Send)
					delete(c.Clients, id)
				}

			}
			// and here we take that new proxy mouth from some user
			// and setup a new mouth in the other users UDP tunnels that
			// will play whatever the origian mouth plays (the user voice)
		case payload := <-c.BroadcastNewTrackChn:
			for id, client := range c.Clients {
				if id == payload.ClientId {
					continue
				}
				alreadyExists := false
				for _, sender := range client.Peer.GetSenders() {
					if sender.Track() != nil && sender.Track().ID() == payload.NewTrack.ID() {
						alreadyExists = true
						break
					}
				}

				if !alreadyExists {
					_, err := client.Peer.AddTrack(payload.NewTrack)
					if err != nil {
						log.Printf("Failed to add track to %v: %v", id, err)
						continue
					}
					client.SignalNegotiation()
				}

				client.SignalNegotiation()
			}

		}
	}

}

func (c *Channel) ServeChannel(w http.ResponseWriter, r *http.Request) {
	conn, err := c.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer conn.Close()

	se := webrtc.SettingEngine{}

	// 1. Allow loopback so it can talk to itself on 127.0.0.1
	se.SetIncludeLoopbackCandidate(true)

	se.SetAnsweringDTLSRole(webrtc.DTLSRoleAuto)

	api := webrtc.NewAPI(webrtc.WithSettingEngine(se))
	peerConnection, err := api.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		log.Printf("failed to init peer connection %v", err)
		return
	}
	defer func() {
		if cErr := peerConnection.Close(); cErr != nil {
			fmt.Printf("cannot close peerConnection: %v\n", cErr)
		}
	}()

	channelId := r.URL.Query().Get("channelId")
	userId := r.URL.Query().Get("userId")

	log.Printf("channel id is %v", channelId)
	log.Printf("user id is %v", userId)

	client := &Client{
		Id:      userId,
		Send:    make(chan []byte, 256),
		Peer:    peerConnection,
		Channel: c,
	}

	// this performs the websocket message sending to client
	go func() {
		for msg := range client.Send {
			err := conn.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				log.Printf("Error writing to websocket: %v", err)
				return
			}
			log.Printf("Sent message to client %s: %s", client.Id, string(msg))
		}
	}()
	// here we stup a handler for when server creates new UDP tunnel with some user,
	// and we need to notify all other channel members that he joined
	// track remote: User A sends their voice up the tunnel to Go.
	client.Peer.OnTrack(func(tr *webrtc.TrackRemote, r *webrtc.RTPReceiver) {
		log.Printf("OnTrack FIRED for client %s, kind: %s, codec: %s", client.Id, tr.Kind(), tr.Codec().MimeType)

		localTrack, err := webrtc.NewTrackLocalStaticRTP(tr.Codec().RTPCodecCapability, client.Id, client.Id)
		if err != nil {
			log.Printf("Error creating local track: %v", err)
			return
		}

		c.trackLock.Lock()
		c.tracks[client.Id] = localTrack
		c.trackLock.Unlock()

		log.Printf("Created and stored local track for %s", client.Id)

		c.BroadcastNewTrackChn <- &BroadcastNewTrack{
			ClientId: client.Id,
			NewTrack: localTrack,
		}

		log.Printf("Starting to relay RTP packets for %s", client.Id)
		packetCount := 0

		for {
			rtp, _, readErr := tr.ReadRTP()
			if readErr != nil {
				log.Printf("RTP read error for %s: %v", client.Id, readErr)
				break
			}
			packetCount++
			if packetCount%100 == 0 {
				log.Printf("Relayed %d packets for %s", packetCount, client.Id)
			}

			err := localTrack.WriteRTP(rtp)
			if err != nil {
				log.Printf("RTP write error for %s: %v", client.Id, err)
			}
		}

		log.Printf("OnTrack loop ended for %s, total packets: %d", client.Id, packetCount)
	})
	peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		log.Print("Server found some candidate")
		candidateData := c.ToJSON()

		payloadBytes, err := json.Marshal(candidateData)
		if err != nil {
			log.Printf("Error marshaling candidate: %v", err)
			return
		}

		msg, err := json.Marshal(WSmsg{
			Type:    "candidate",
			Payload: json.RawMessage(payloadBytes),
		})

		if err != nil {
			log.Printf("failed to marshal new ws message: %v", err)
			return
		}

		client.SafeSend(msg)
	})

	c.Register <- client

	// this keeps reading incoming websocket messages
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("read: ", err)
			c.Unregister <- client
			break
		}

		var msg WSmsg
		err = json.Unmarshal(message, &msg)
		if err != nil {
			log.Printf("Failed to unmarshal message: %v", err)
			continue
		}

		log.Printf("Parsed message type: %s from client %s", msg.Type, client.Id)

		switch msg.Type {
		case "offer":
			log.Printf("Received OFFER from client %s", client.Id)
			var sdp string
			json.Unmarshal(msg.Payload, &sdp)

			offer := webrtc.SessionDescription{
				Type: webrtc.SDPTypeOffer,
				SDP:  sdp,
			}

			err := client.Peer.SetRemoteDescription(offer)
			if err != nil {
				log.Printf("Error setting remote description: %v", err)
				break
			}

			client.mu.Lock()
			client.ready = true
			client.mu.Unlock()

			// Add any existing tracks before creating answer
			c.trackLock.RLock()
			trackCount := 0
			for ownerId, track := range c.tracks {
				if ownerId == client.Id {
					continue
				}
				log.Printf("Adding track from %s to %s", ownerId, client.Id)
				client.Peer.AddTrack(track)
				trackCount++
			}
			c.trackLock.RUnlock()

			log.Printf("Added %d existing tracks to client %s", trackCount, client.Id)

			// Create answer
			answer, err := client.Peer.CreateAnswer(nil)
			if err != nil {
				log.Printf("❌ Error creating answer: %v", err)
				break
			}

			err = client.Peer.SetLocalDescription(answer)
			if err != nil {
				log.Printf("❌ Error setting local description: %v", err)
				break
			}

			log.Printf("Sending answer to client %s", client.Id)
			answerMsg, _ := json.Marshal(map[string]any{
				"type":    "answer",
				"payload": answer.SDP,
			})
			client.SafeSend(answerMsg)

		case "answer":
			var sdp string
			json.Unmarshal(msg.Payload, &sdp)
			log.Printf("Received answer from client %s", client.Id)

			answer := webrtc.SessionDescription{
				Type: webrtc.SDPTypeAnswer,
				SDP:  sdp,
			}

			err := client.Peer.SetRemoteDescription(answer)
			if err != nil {
				log.Printf("Error setting remote description: %v", err)
			} else {
				log.Printf("Answer accepted for client %s", client.Id)
			}
		case "candidate":
			var candidate webrtc.ICECandidateInit
			json.Unmarshal(msg.Payload, &candidate)
			log.Printf("Adding ICE candidate from client %s", client.Id)
			err := peerConnection.AddICECandidate(candidate)
			if err != nil {
				log.Printf("Error adding ICE candidate: %v", err)
			}
		}
	}

}
