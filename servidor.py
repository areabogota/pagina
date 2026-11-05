"""
local server for testing the site
 python servidor.py [puerto]
"""
import http.server
import os
import sys

PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
RAIZ = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        ruta_404 = os.path.join(RAIZ, "404.html")
        with open(ruta_404, "rb") as f:
            cuerpo = f.read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(cuerpo)


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("", PUERTO), Handler) as servidor:
        print(f"Sirviendo en http://localhost:{PUERTO}  (Ctrl+C para detener)")
        servidor.serve_forever()
