package main

import (
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func isFileUploadCompleted(c *gin.Context) bool {
	contentRangeHeader := c.Request.Header.Get("Content-Range")
	rangeAndSize := strings.Split(contentRangeHeader, "/")
	rangeParts := strings.Split(rangeAndSize[0], "-")

	rangeMax, e := strconv.Atoi(rangeParts[1])
	if e != nil {
		panic("Could not parse range max from header")
	}

	fileSize, e := strconv.Atoi(rangeAndSize[1])
	if e != nil {
		panic("Could not parse file size from header")
	}

	return fileSize == rangeMax
}

func uploadFile(c *gin.Context) {
	var f *os.File
	file, header, e := c.Request.FormFile("file")

	if f == nil {
		f, e = os.OpenFile("uploads/"+header.Filename, os.O_APPEND|os.O_CREATE|os.O_RDWR, 0644)
		if e != nil {
			panic("Error creating file on the filesystem: " + e.Error())
		}
	}

	if _, e := io.Copy(f, file); e != nil {
		panic("Error during chunk write:" + e.Error())
	}

	if isFileUploadCompleted(c) {
		if e = f.Close(); e != nil {
			panic("Error closing the file, I/O problem?")
		}
	}
}

func main() {
	router := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Content-Type", "Content-Length", "Content-Range", "Accept-Encoding", "X-CSRF-Token", "Authorization", "accept", "origin", "Cache-Control", "X-Requested-With"}
	router.Use(cors.New(config))

	router.LoadHTMLGlob("templates/*.html")
	rg := router.Group("api/v1")
	{
		rg.POST("/photo", uploadFile)
	}

	router.Static("/uploads", "./uploads")
	router.Static("/static", "./static")
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "upload.html", gin.H{})
	})

	router.Run()
}
