#!/usr/bin/env python3
"""
Simple HTTP server for the Moby Dick reader
"""
import http.server
import socketserver
import os
import socket

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def get_local_ip():
    """Get the local IP address"""
    try:
        # Create a socket to get the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "unknown"

# Change to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = MyHTTPRequestHandler
local_ip = get_local_ip()

print(f"🐋 Starting Moby Dick server...")
print(f"📖 On this computer: http://localhost:{PORT}")
print(f"📱 On your phone/tablet: http://{local_ip}:{PORT}")
print(f"Press Ctrl+C to stop the server\n")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Happy reading!")

