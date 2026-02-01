package channel

import (
	"sync"

	"github.com/gorilla/websocket"
)

type ChannelManager struct {
	channels map[string]*Channel
	sync.RWMutex
}

func NewChannelManager() *ChannelManager {

	return &ChannelManager{
		channels: make(map[string]*Channel),
	}
}

func (m *ChannelManager) GetOrCreateChannel(channelId string, up *websocket.Upgrader) *Channel {
	m.Lock()
	defer m.Unlock()

	if val, ok := m.channels[channelId]; ok {
		return val
	}

	channel := NewChannel(up)
	go channel.Run()
	m.channels[channelId] = channel

	return channel
}
