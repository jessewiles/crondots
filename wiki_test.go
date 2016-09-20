package main

import (
	"io/ioutil"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"testing"
)

func TestLoadPageNotExists(t *testing.T) {
	p, _ := loadPage("notExists")
	if p != nil {
		t.Error("Expected nil, got: ", p)
	}
}

func TestLoadPage(t *testing.T) {
	data := []byte("hello world")
	err := ioutil.WriteFile("999test.txt", data, 0644)
	if err != nil {
		return
	}
	p, _ := loadPage("999test")
	if !reflect.DeepEqual(data, p.Body) {
		t.Errorf("Expected %s, got: %s", data, string(p.Body))
	}
	os.Remove("999test.txt")
}

func TestEditHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "http://example.com/edit/FooBar", nil)
	w := httptest.NewRecorder()
	handler := makeHandler(editHandler)
	handler(w, req)
	if !strings.Contains(w.Body.String(), "Editing FooBar") {
		t.Errorf("Unexpected edit handler payload: %s", w.Body.String())
	}
}

func TestSaveHandler(t *testing.T) {
	req := httptest.NewRequest("POST", "http://example.com/save/SaturdayInThePark",
		strings.NewReader("body=All%20the%20things&title=SaturdayInThePark"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded; param=value")
	w := httptest.NewRecorder()
	handler := makeHandler(saveHandler)
	handler(w, req)

	if w.Code != 302 {
		t.Errorf("Unexpected result: %d", w.Code)
	}
	if !strings.Contains(w.HeaderMap["Location"][0], "/view/SaturdayInThePark") {
		t.Errorf("Unexpected redirect location: %s", w.HeaderMap["Location"][0])
	}
}

func TestViewHandler(t *testing.T) {
	defer os.Remove("SaturdayInThePark.txt")
	req := httptest.NewRequest("GET", "http://example.com/view/SaturdayInThePark", nil)
	w := httptest.NewRecorder()
	handler := makeHandler(viewHandler)
	handler(w, req)
	if !strings.Contains(w.Body.String(), "All the things") {
		t.Errorf("Unexpected view payload: %s", w.Body.String())
	}
}

func TestNoExistViewHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "http://example.com/view/SaturdayInThePark", nil)
	w := httptest.NewRecorder()
	handler := makeHandler(viewHandler)
	handler(w, req)

	if w.Code != 302 {
		t.Errorf("Unexpected result: %d", w.Code)
	}
	if !strings.Contains(w.HeaderMap["Location"][0], "/edit/SaturdayInThePark") {
		t.Errorf("Unexpected redirect location: %s", w.HeaderMap["Location"][0])
	}
}

func TestMain(t *testing.T) {
	go func() {
		main()
	}()
}
