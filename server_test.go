package main

import (
	"net/http/httptest"
	"strings"
	"testing"

	"gopkg.in/mgo.v2/bson"
)

func TestSiteIndexHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "http://localhost:8080/", nil)
	w := httptest.NewRecorder()
	siteIndexHandler(w, req)
	if !strings.Contains(w.Body.String(), "Crondots") {
		t.Errorf("Unexpected site index payload: %s", w.Body.String())
	}
}

func TestRagisterHandler(t *testing.T) {
	srv, err := NewServer()
	if err != nil {
		t.Error("problem creating database session")
		return
	}
	defer srv.Close()

	req := httptest.NewRequest("POST", "http://localhost:8080/register",
		strings.NewReader("{\"email\":\"foo@bar.com\", \"password\":\"pickles\"}"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	fn := srv.WithData(registerHandler)
	fn(w, req)

	if w.Code != 200 {
		t.Errorf("invalid return code from registration: %v", w.Code)
	}

	// Confirm user
	var confirm User
	db := srv.dbsession.Copy()
	defer db.Close()

	err = db.DB("cdots").C("users").Find(bson.M{"email": "foo@bar.com"}).One(&confirm)
	if err != nil {
		err = db.DB("cdots").C("Users").Remove(bson.M{"email": "foo@bar.com"})
		t.Errorf("unable to confirm registration: %v", err)
	}
	err = db.DB("cdots").C("users").Remove(bson.M{"email": "foo@bar.com"})
}
