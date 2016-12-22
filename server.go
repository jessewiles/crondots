package main

import (
	"encoding/json"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/context"

	"golang.org/x/crypto/bcrypt"
	mgo "gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

// Server - db server
type Server struct {
	dbsession *mgo.Session
}

// NewServer - constructor helper
func NewServer() (*Server, error) {
	dbsession, err := mgo.Dial("localhost")
	if err != nil {
		return nil, err
	}
	return &Server{dbsession: dbsession}, nil
}

// Close - DB close helper
func (s *Server) Close() {
	s.dbsession.Close()
}

// WithData - Wrapper (middleware-ish) function
func (s *Server) WithData(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbcopy := s.dbsession.Copy()
		defer dbcopy.Close()
		context.Set(r, "db", dbcopy)
		fn(w, r)
	}
}

// FrontPage - blah blah blah
type FrontPage struct {
	Nada string
}

// UserRegistration - blah blah blah
type UserRegistration struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func siteIndexHandler(w http.ResponseWriter, r *http.Request) {
	t, err := template.New("main.html").Delims("[[", "]]").ParseFiles("templates/main.html")
	if err != nil {
		log.Fatal(err)
	}

	err = t.Execute(w, &FrontPage{Nada: "scoobie"})
	if err != nil {
		log.Fatal(err)
	}
}

func handleThing(w http.ResponseWriter, r *http.Request) {
	db := context.Get(r, "db").(*mgo.Session)
	err := db.DB("test").C("things").Insert(bson.M{"val": 1})
	if err != nil {
		// handle error
	}
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var ur UserRegistration
	err = json.Unmarshal(body, &ur)
	if err != nil {
		log.Print("Error unmarshaling.")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// check if email exists
	db := context.Get(r, "db").(*mgo.Session)
	var existing UserRegistration

	err = db.DB("cdots").C("users").Find(bson.M{"email": ur.Email}).One(&existing)
	if err == nil {
		log.Print("Error when fetching existing.")
		w.WriteHeader(http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(ur.Password), bcrypt.DefaultCost)
	ur.Password = string(hashedPassword)
	err = db.DB("cdots").C("users").Insert(&ur)
	if err != nil {
		log.Print("Error inserting user.")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func main() {
	srv, err := NewServer()
	if err != nil {
		// handle error
	}
	defer srv.Close() // close the server later

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static", fs))
	http.HandleFunc("/", siteIndexHandler)
	http.HandleFunc("/things", srv.WithData(handleThing))
	http.HandleFunc("/register", srv.WithData(registerHandler))
	http.ListenAndServe(":8080", nil)
}
