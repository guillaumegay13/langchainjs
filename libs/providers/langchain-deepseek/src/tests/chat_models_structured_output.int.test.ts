import { test, expect, describe } from "vitest";
import { z } from "zod";
import { ChatDeepSeek } from "../chat_models.js";

const personSchema = z.object({
  name: z.string().describe("The person's full name"),
  age: z.number().describe("The person's age in years"),
  occupation: z.string().describe("The person's occupation"),
});

describe("DeepSeek structured output", () => {
  test("withStructuredOutput extracts a typed object", async () => {
    const llm = new ChatDeepSeek({
      model: "deepseek-v4-pro",
      temperature: 0,
    });
    const structured = llm.withStructuredOutput(personSchema, {
      name: "extract_person",
    });
    const result = await structured.invoke(
      "Ada Lovelace was a 36 year old mathematician."
    );
    expect(result.name.toLowerCase()).toContain("lovelace");
    expect(result.age).toBe(36);
    expect(result.occupation.toLowerCase()).toContain("mathematician");
  }, 60000);

  test("forced tool call returns the requested tool", async () => {
    const llm = new ChatDeepSeek({
      model: "deepseek-v4-pro",
      temperature: 0,
    });
    const withTool = llm.bindTools(
      [
        {
          type: "function",
          function: {
            name: "extract_person",
            description: "Extract a person from the text",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                age: { type: "number" },
              },
              required: ["name", "age"],
            },
          },
        },
      ],
      {
        tool_choice: {
          type: "function",
          function: { name: "extract_person" },
        },
      }
    );
    const result = await withTool.invoke(
      "Grace Hopper was a 79 year old computer scientist."
    );
    expect(result.tool_calls).toHaveLength(1);
    expect(result.tool_calls?.[0].name).toBe("extract_person");
  }, 60000);
});
