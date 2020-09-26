ab -n 1000 -c 300 http://127.0.0.1:3000/

autocannon -c 100 -d 5 -p 10 http://127.0.0.1:3000/

0x --output-dir=profile dist/runtimes/jsgram.js

0x -P "autocannon -c 100 -d 5 -p 10 http://127.0.0.1:$PORT" dist/runtimes/jsgram.js