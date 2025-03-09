import { supabase } from "../../lib/supabase";

export async function POST({ request }) {
  try {
    const body = await request.json();

    // Validate required fields
    const { content, schoolId, titulo } = body;

    if (!content || !schoolId || !titulo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "All fields are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Make sure schoolId is a number
    const schoolIdNum = Number(schoolId);

    if (isNaN(schoolIdNum)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid school ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify the school exists
    const { data: schoolData, error: schoolError } = await supabase
      .from("schools")
      .select("id")
      .eq("id", schoolIdNum)
      .single();

    if (schoolError || !schoolData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "School not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insert the new post into Supabase with school as bigint foreign key
    const { data, error } = await supabase
      .from("secrets")
      .insert([
        {
          content,
          school: schoolIdNum, // Using the numeric school ID as foreign key
          titulo,
          approved: true,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating post:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          data: body,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data[0],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
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
