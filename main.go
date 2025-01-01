package main

import (
	"fmt"
	"log"
	"net/http"
)

type LogerResponseWriter struct {
	http.ResponseWriter
	StatusCode int
}

func (l *LogerResponseWriter) WriteHeader(statusCode int) {
	l.StatusCode = statusCode
	l.ResponseWriter.WriteHeader(statusCode)
}

func Main() error {
	fs := http.FileServer(http.Dir("build"))
	err := http.ListenAndServe(":8080", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		l := &LogerResponseWriter{ResponseWriter: w}
		fs.ServeHTTP(l, r)
		fmt.Printf("%d %s %s\n", l.StatusCode, r.Method, r.RequestURI)
	}))
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
