package main

import (
	"encoding/json"
	"errors"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/context"
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	uuid "github.com/satori/go.uuid"

	"encoding/gob"

	"golang.org/x/crypto/bcrypt"
	mgo "gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

var store = sessions.NewCookieStore([]byte("!pml$onk&ibj)uvh"))

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
	User User
}

func writeMainPage(w http.ResponseWriter, r *http.Request, u User) {
	t, err := template.New("main.html").Delims("[[", "]]").ParseFiles("templates/main.html")
	if err != nil {
		log.Fatal(err)
	}
	err = t.Execute(w, &FrontPage{User: u})
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func getSessionCookie(r *http.Request) (*http.Cookie, error) {
	sessionCookie, err := r.Cookie("session")
	if err != nil {
		log.Print("No session cookie.")
		return nil, errors.New("no session cookie")
	}
	return sessionCookie, nil
}

func getSession(r *http.Request, s string) (*sessions.Session, error) {
	session, err := store.Get(r, s)
	if err != nil {
		log.Print("No session.")
		return nil, errors.New("problem getting the session")
	}
	return session, nil
}

func decodeSession(r *http.Request) (*User, error) {
	sessionCookie, err := getSessionCookie(r)
	if err != nil {
		return nil, err
	}
	session, err := getSession(r, sessionCookie.Value)
	if err != nil {
		return nil, err
	}
	val := session.Values["user"]
	user, ok := val.(*User)
	if user != nil && !ok {
		log.Print("Problem decoding the session")
		return nil, errors.New("problem decoding the session")
	}
	return user, nil
}

func siteIndexHandler(w http.ResponseWriter, r *http.Request) {
	user, err := decodeSession(r)
	if err != nil {
		writeMainPage(w, r, User{})
		return
	}
	writeMainPage(w, r, *user)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var user User
	err = json.Unmarshal(body, &user)
	if err != nil {
		log.Print("Error unmarshaling.")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// check if email exists
	db := context.Get(r, "db").(*mgo.Session)
	var existing User

	err = db.DB("cdots").C("users").Find(bson.M{"email": user.Email}).One(&existing)
	if err == nil {
		log.Print("Error when fetching existing.")
		w.WriteHeader(http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)
	err = db.DB("cdots").C("users").Insert(&user)
	if err != nil {
		log.Print("Error inserting user.")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func signinHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var user User
	err = json.Unmarshal(body, &user)
	if err != nil {
		log.Print("Error unmarshaling.")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// check if email exists
	db := context.Get(r, "db").(*mgo.Session)
	var existing User

	err = db.DB("cdots").C("users").Find(bson.M{"email": user.Email}).One(&existing)
	if err != nil {
		log.Print("Error when fetching existing.")
		w.WriteHeader(http.StatusNotFound)
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(existing.Password), []byte(user.Password))
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Generate, store and set session info
	sessionID := uuid.NewV4().String()
	cookie := http.Cookie{Name: "session", Value: sessionID}
	session, err := store.Get(r, sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	session.Values["user"] = existing
	sessions.Save(r, w)

	http.SetCookie(w, &cookie)
	w.WriteHeader(http.StatusOK)
	userJSON, _ := json.Marshal(existing)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Length", string(len(userJSON)))
	w.Write(userJSON)
}

func uuidHandler(w http.ResponseWriter, r *http.Request) {
	auuid := []byte(uuid.NewV4().String())
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Content-Length", strconv.Itoa(len(auuid)))
	w.Write(auuid)
}

func timelinesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		user, err := decodeSession(r)
		if err != nil {
			// write an empty list and bug out if there's no user
			payload := []byte("[]")
			w.WriteHeader(http.StatusOK)
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Content-Length", strconv.Itoa(len(payload)))
			w.Write(payload)
			return
		}

		db := context.Get(r, "db").(*mgo.Session)

		var timelines []Timeline

		log.Printf("%#v", user)
		err = db.DB("cdots").C("timeline").Find(bson.M{"user": user.ID}).All(&timelines)

		payload, err := json.Marshal(timelines)

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Length", strconv.Itoa(len(payload)))
		w.Write(payload)
	}
}

func init() {
	gob.Register(&User{})
}

func main() {
	srv, err := NewServer()
	if err != nil {
		// handle error
	}
	defer srv.Close() // close the server later

	r := mux.NewRouter()
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	r.HandleFunc("/", srv.WithData(siteIndexHandler))
	r.HandleFunc("/auuid", uuidHandler)
	r.HandleFunc("/register", srv.WithData(registerHandler))
	r.HandleFunc("/signin", srv.WithData(signinHandler))
	r.HandleFunc("/timelines", srv.WithData(timelinesHandler))
	websrv := &http.Server{
		Handler: r,
		Addr:    ":8080",
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Fatal(websrv.ListenAndServe())
}
