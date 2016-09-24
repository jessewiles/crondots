# This is a comment
FROM ubuntu:14.04
MAINTAINER Jesse Wiles <jesse.wiles@gmail.com>
RUN apt-get update && apt-get install -y vim golang sqlite3

