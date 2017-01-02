package main

import (
	"gopkg.in/mgo.v2/bson"
)

// Timeline - blah
type Timeline struct {
	ID   bson.ObjectId `json:"id" bson:"_id,omitempty"`
	User bson.ObjectId `json:"user" bson:"user"`
	Dots []Dot         `json:"dots"`
}

// Dot - blah
type Dot struct {
	ID      string `json:"id"`
	Content string `json:"content"`
	Start   string `json:"start"`
	End     string `json:"end,omitempty"`
}
