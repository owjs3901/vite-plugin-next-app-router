'use client'
import {useState} from "react";
export default function ClientComponent(){
    const [count, setCount] = useState(0)

    return <div>
        <button onClick={()=>setCount(p=>p+1)}>
            client {count}
        </button>
    </div>
}

