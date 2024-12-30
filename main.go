package main

import (
	"fmt"
	"log"
	"net/http"
)

func Main() error {
	err := http.ListenAndServe(":8080", (http.FileServer(http.Dir("static"))))
	if err != nil {
		return fmt.Errorf("http.ListenAndServe: %w", err)
	}
	return nil
}

func main() {
	if err := Main(); err != nil {
		log.Println(err)
	}
}
