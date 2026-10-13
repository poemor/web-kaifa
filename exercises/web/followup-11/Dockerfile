FROM golang:1.26.9 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -trimpath -o /club .
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /club /app/club
COPY web /app/web
EXPOSE 8770
USER nonroot:nonroot
ENTRYPOINT ["/app/club"]
