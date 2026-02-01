package main

import (
	"encoding/json"
	"log"
	"net/http"

	"githhub.com/antoni-ostrowski/go-server/channel"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
	return true
}}

func main() {
	channelManager := channel.NewChannelManager()

	http.HandleFunc("/channel", func(w http.ResponseWriter, r *http.Request) {
		channelId := r.URL.Query().Get("channelId")
		if channelId == "" {
			http.Error(w, "no channel id provided", http.StatusBadRequest)
			return
		}

		channel := channelManager.GetOrCreateChannel(channelId, &upgrader)
		log.Printf("serving for channel %s", channelId)
		log.Printf("channel contains %v clients", len(channel.Clients))
		for val, _ := range channel.Clients {
			log.Printf("client id - %v", val)
		}
		channel.ServeChannel(w, r)

	})
	log.Fatal(http.ListenAndServe("localhost:8080", nil))
}

type WSRequest struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}
