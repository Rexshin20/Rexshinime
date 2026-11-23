const http = require("http");
const fs = require("fs");
const path = require("path");
const root = "D:\\anime-v1.0.0";
const types = {".html":"text/html", ".js":"application/javascript", ".css":"text/css", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml"};
http.createServer(function (req, res) {
  var p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  var f = path.join(root, p);
  fs.readFile(f, function (e, d) {
    if (e) { res.writeHead(404); res.end("not found"); return; }
    res.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream");
    res.end(d);
  });
}).listen(8000, function () { console.log("ready"); });
