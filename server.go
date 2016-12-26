package main

import (
	"encoding/json"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/context"
	uuid "github.com/satori/go.uuid"

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

// User - blah blah blah
type User struct {
	ID       bson.ObjectId `json:"id" bson:"_id,omitempty"`
	Email    string        `json:"email"`
	Password string        `json:"password"`
}

// Session - blah blah blah
type Session struct {
	ID      bson.ObjectId `json:"id" bson:"_id,omitempty"`
	Session string        `json:"session"`
	Email   string        `json:"email"`
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

func sessionHandler(w http.ResponseWriter, r *http.Request) {
	var session Session
	var active User

	db := context.Get(r, "db").(*mgo.Session)

	cookie, err := r.Cookie("session")
	if err != nil {
		active = User{Email: "anonymous@anonymous"}
	} else {
		err = db.DB("cdots").C("session").Find(bson.M{"session": cookie.String()}).One(&session)
		if err != nil {
			log.Print("Problem reading session.")
			return
		}
		err = db.DB("cdots").C("users").Find(bson.M{"email": session.Email}).One(&active)
		if err != nil {
			log.Print("Problem reading session.")
			return
		}
	}

	payload, err := json.Marshal(&active)
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Length", string(len(payload)))
	w.Write(payload)
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
	session := Session{Email: existing.Email, Session: uuid.NewV4().String()}
	err = db.DB("cdots").C("session").Insert(&session)

	cookie := http.Cookie{Name: "session", Value: session.Session}
	http.SetCookie(w, &cookie)
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
	http.HandleFunc("/", srv.WithData(siteIndexHandler))
	http.HandleFunc("/session", srv.WithData(sessionHandler))
	http.HandleFunc("/things", srv.WithData(handleThing))
	http.HandleFunc("/register", srv.WithData(registerHandler))
	http.HandleFunc("/signin", srv.WithData(signinHandler))
	http.ListenAndServe(":8080", nil)
}
