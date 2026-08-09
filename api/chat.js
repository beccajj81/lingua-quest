export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      message,
      language = "Spanish",
      level = "Beginner",
      tutor = "Maya",
      mission = "Hotel Check-In"
    } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const prompt = `
You are ${tutor}, an AI language tutor inside a game called Lingua Quest.

The learner is studying ${language}.
Their level is ${level}.
The current mission is ${mission}.

Your job is to:
1. Continue the conversation naturally in the target language.
2. Keep the conversation appropriate for an adult learner.
3. Encourage the learner rather than embarrassing them.
4. Correct important mistakes without interrupting the roleplay.
5. Give a short explanation when a correction is useful.
6. Adjust your language to the learner's level.
7. Keep the conversation focused on the current mission.

Return ONLY valid JSON in this exact structure:

{
  "reply": "Your natural response in the target language",
  "correction": "A brief correction, or empty string if none is needed",
  "explanation": "A short explanation, or empty string if none is needed",
  "xp": 10,
  "vocabulary": []
}

Learner message:
${message}
`;
if (!process.env.OPENAI_API_KEY) {
  return res.status(500).json({
    error: "OPENAI_API_KEY is missing from Vercel"
  });
}
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          input: prompt
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(response.status).json({
        error: "OpenAI request failed",
        details: errorText
      });
    }

    const data = await response.json();

    const output =
      data.output_text ||
      "";

    let result;

    try {
      result = JSON.parse(output);
    } catch {
      result = {
        reply: output,
        correction: "",
        explanation: "",
        xp: 10,
        vocabulary: []
      };
    }

    return res.status(200).json(result);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong"
    });

  }
}
