package channel

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Channel struct {
	Upgrader   *websocket.Upgrader
	Clients    map[string]chan []byte
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []byte
}

type Client struct {
	Id   string
	Send chan []byte
}

func NewChannel(up *websocket.Upgrader) *Channel {
	return &Channel{
		Upgrader:   up,
		Clients:    make(map[string]chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
	}
}

func (c *Channel) Run() {
	for {
		select {
		case client := <-c.Register:
			log.Printf(":) registering new client %v", client.Id)
			c.Clients[client.Id] = client.Send
		case client := <-c.Unregister:
			if _, ok := c.Clients[client.Id]; ok {
				log.Printf(":( unregistering new client %v", client.Id)
				delete(c.Clients, client.Id)
				close(client.Send)
			}
		case msg := <-c.Broadcast:
			log.Printf("starting broadcast loop")
			for id, sendChan := range c.Clients {
				select {
				case sendChan <- msg:
				default:
					close(sendChan)
					delete(c.Clients, id)
				}

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

	log.Printf("inside serve channel func")

	channelId := r.URL.Query().Get("channelId")
	userId := r.URL.Query().Get("userId")

	log.Printf("channel id is %v", channelId)
	log.Printf("user id is %v", userId)
	client := &Client{Id: userId, Send: make(chan []byte)}

	c.Register <- client

	go func() {
		for msg := range client.Send {
			conn.WriteMessage(websocket.TextMessage, msg)
		}
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("read: ", err)
			c.Unregister <- client
			break
		}

		c.Broadcast <- message

		log.Printf("received msg from ws client: %v", message)

	}

}
