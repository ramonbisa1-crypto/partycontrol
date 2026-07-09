import {useState} from "react";
import {supabase} from "../lib/supabase";


export default function Login(){


const [email,setEmail]=useState("");

const [password,setPassword]=useState("");

const [error,setError]=useState("");



async function login(){


const {error}=await supabase.auth.signInWithPassword({

email,

password

});


if(error){

setError(error.message);

}

}



return (

<div className="
h-screen
flex
items-center
justify-center
bg-black
">


<div className="
bg-zinc-900
p-8
rounded-xl
w-96
">


<h1 className="
text-3xl
font-bold
text-yellow-400
mb-8
">
🎉 PartyControl
</h1>



<input

className="
w-full
p-3
mb-4
bg-zinc-800
rounded
"

placeholder="Email"

onChange={
e=>setEmail(e.target.value)
}

/>



<input

className="
w-full
p-3
mb-4
bg-zinc-800
rounded
"

placeholder="Passwort"

type="password"

onChange={
e=>setPassword(e.target.value)
}

/>



<button

onClick={login}

className="
bg-yellow-400
text-black
w-full
p-3
rounded
font-bold
"

>

Login

</button>


<p className="text-red-400 mt-4">

{error}

</p>


</div>


</div>


)

}