const MODEL = "gemini-2.5-flash-preview-tts";

const voiceMap = {
  "Deep Male": "Charon",
  "Soft Female": "Aoede",
  "Powerful Male": "Fenrir",
  "Cinematic": "Orus",
  "Storyteller": "Kore",
  "News Anchor": "Charon",
  "Motivational": "Fenrir",
  "Emotional": "Aoede",
  "Villain": "Fenrir",
  "Heroic": "Orus",
  "Romantic": "Aoede",
  "Calm": "Kore",
  "Energetic": "Puck",
  "Friendly": "Puck",
  "Dramatic": "Orus",
  "Cute": "Leda"
};

export default async (request) => {

  if (request.httpMethod !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed"
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {

    const body = await request.json();

    const text = body.text?.trim();

    if (!text) {
      return new Response(
        JSON.stringify({
          error: "Text is required."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({
          error: "Maximum 5000 characters allowed."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const voiceName =
      voiceMap[body.voice] || "Charon";

    const prompt = `
Speak this text in natural Indian Hindi.

Voice style:
${body.voice || "Deep Male"}

Emotion:
${body.emotion || "Natural"}

Speaking speed:
${body.speed || "Medium"}

Delivery:
${body.delivery || "Natural"}

Pronounce Hindi naturally and clearly.
Do not translate.
Do not add extra words.
Speak only the supplied text.

Text:
${text}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key":
            process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({

          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          generationConfig: {

            responseModalities: [
              "AUDIO"
            ],

            speechConfig: {

              voiceConfig: {

                prebuiltVoiceConfig: {
                  voiceName
                }

              }

            }

          }

        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(data);

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Gemini API error."
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const part =
      data?.candidates?.[0]
        ?.content?.parts
        ?.find(item => item.inlineData);

    if (!part?.inlineData?.data) {

      return new Response(
        JSON.stringify({
          error: "Audio response nahi mila."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const audio =
      part.inlineData.data;

    const mimeType =
      part.inlineData.mimeType ||
      "audio/L16;rate=24000";

    return new Response(
      JSON.stringify({
        audio:
          `data:${mimeType};base64,${audio}`
      }),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );

  } catch (error) {

    console.error(error);

    return new Response(
      JSON.stringify({
        error: "Server error."
      }),
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
};
