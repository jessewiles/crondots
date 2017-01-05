package main

import "gopkg.in/mgo.v2/bson"

// User - blah blah blah
type User struct {
	ID       bson.ObjectId `json:"id" bson:"_id,omitempty"`
	Email    string        `json:"email"`
	Password string        `json:"password"`
}
