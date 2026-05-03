const express = require('express')

function block_1_httpMethod() {
    return new Promise((resolve) => {
        const app = express()
        app.use(express.json())
        const logs = []
        // request logger
        app.use((req, res, next) => {
            // add to database
            // console log everything
            // write in some file
            const logEntry = `${req.method} : ${req.url}`
            logs .push(logEntry)
            console.log(`[LOG] -- ${logEntry}`);

            // if your request hangs forever next is missing
            next()
        })

        app.use((req, res, next) =>{
            req.startTime = Date.now()
            res.on('finish', () => {
                const duration = Date.now - req.startTime
                console.log(`[TIMER] - ${req.method} - ${req.url} took ${duration}ms`);
            })

            next()
        })

        function authMe (req, res, next) {
            const token = req.headers[X-auth-token]
            if(!token){
                return res.status(401).json({error: "no token"})
            }
            if(token !=="screat-box"){
                return res.status(403).json({error: "No token"})
            }
            req.user = {id: 1, name: "Rajat", role:"admin"}

            next()
        }

        function getRole(role){
            return (req, res, next) => {
                if(! req.user || req.user)
            }
        }

        app.get("/profile", authMe, getRole('admin'), oneMore () => {})

        const server = app.listen(0, async () =>{
            const port = server.address().port
            const base = `http://127.0.0.1:${port}`

            try{
                // TODO
                const listRes = await fetch(`${base}/routes`)
                const listData = await listRes.json()

                const createRes = await fetch(`${base}/routes`, {
                    method: "POST", 
                    headers: {
                        'Content-Type': "application/json",
                        body: JSON.stringify({
                            name: "Colaba", 
                            direction: "West"
                        })
                    }
                })
            }
            catch (error){
                console.log(error);
            }
            server.close(() =>{
                console.log("Block 1 server ");
                resolve()
            })
        })
    })
}




async function main() {
    await block_1_httpMethod()
    process.exit(0)
}

main()