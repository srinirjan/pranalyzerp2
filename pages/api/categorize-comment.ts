import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { commentBody, codeContext } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that categorizes code review comments. Categorize the given comment as either 'technical', 'nonTechnical', or 'nit' based on the comment content and the surrounding code context."
        },
        {
          role: "user",
          content: `Comment: ${commentBody}\n\nCode Context:\n${codeContext}`
        }
      ],
      max_tokens: 50
    });

    const category = completion.choices[0].message.content?.toLowerCase();
    let result: 'technical' | 'nonTechnical' | 'nit';

    if (category?.includes('technical')) {
      result = 'technical';
    } else if (category?.includes('nit')) {
      result = 'nit';
    } else {
      result = 'nonTechnical';
    }

    res.status(200).json({ category: result });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ message: 'Error categorizing comment' });
  }
}