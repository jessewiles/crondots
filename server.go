package main

import (
	"html/template"
	"net/http"
)

type FrontPage struct {
	Nada string
}

func siteIndexHandler(w http.ResponseWriter, r *http.Request) {
	t, _ := template.ParseFiles("templates/main.html")
    t.Execute(w, &FrontPage{Nada: "scoobie"})
}

func main()  {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/",  http.StripPrefix("/static", fs))
	http.HandleFunc("/", siteIndexHandler)
    http.ListenAndServe(":8080", nil)
}