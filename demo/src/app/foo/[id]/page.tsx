export default function IdParams({
    params
                                 }:{
    params: {
        id:string
    }
}){
    return <div>
        id: {params.id}
    </div>
}


export function generateStaticParams():{id:string}[] {
    return [{
        id:"1"
    },{
        id:"2"
    }]
}
