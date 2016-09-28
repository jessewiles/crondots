package main

import (
	"html/template"
	"log"
	"net/http"
)

type FrontPage struct {
	Nada string
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

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static", fs))
	http.HandleFunc("/", siteIndexHandler)
	http.ListenAndServe(":8080", nil)
}
