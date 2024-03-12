
import {readFile } from 'fs/promises'
import ClientComponent from "./client.tsx";
import ServerComponent from "./server.tsx";
export default async function IndexPage(){
    const packageJson=await readFile("./package.json", "utf-8")
    return <div>
        hello world test!
        {packageJson}
        <ServerComponent />
        <ClientComponent/>
    </div>
}

