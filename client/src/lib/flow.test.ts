import { describe, expect, it } from "vitest";
import { workflowLinks } from "./flow";

describe("reference workflow links", () => {
  it("builds the complete encoded route sequence", () => {
    const search = workflowLinks.search("قولوا لها");
    const keyword = workflowLinks.keyword("راي");
    const song = workflowLinks.song("قولوا-لها");
    const media = workflowLinks.media("token/32");
    const conversion = workflowLinks.conversion("youtube-id");
    expect(search).toBe("/search?q=%D9%82%D9%88%D9%84%D9%88%D8%A7%20%D9%84%D9%87%D8%A7");
    expect(keyword).toBe("/s/%D8%B1%D8%A7%D9%8A");
    expect(song).toBe("/s/%D9%82%D9%88%D9%84%D9%88%D8%A7-%D9%84%D9%87%D8%A7");
    expect(media).toBe("/media?d=token%2F32");
    expect(conversion).toBe("/videos_dl?v=youtube-id");
  });
});
