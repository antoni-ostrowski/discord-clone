package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
	return true
}}

func main() {
	http.HandleFunc("/echo", echo)
	log.Fatal(http.ListenAndServe("localhost:8080", nil))
}

func echo(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()

	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read: ", err)
			break
		}

		log.Printf("rev: %v", message)
		err = c.WriteMessage(mt, []byte("testing"))
		if err != nil {
			log.Println("write: ", err)
			break
		}

	}

}
