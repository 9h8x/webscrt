import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";
import { array } from "astro:schema";

export async function POST({ request }) {
  try {
    const {secret} = await request.json()
    console.log(secret)
    const {data, error} = await supabase.from('secret_images').select('*').eq("secret_id", secret)
    const urlsArray = data.map(item => item.urls.publicUrl);
    console.log(urlsArray)
    return new Response(
      JSON.stringify({
        success: true,
        items: urlsArray
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
