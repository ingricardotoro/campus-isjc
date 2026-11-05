import { describe, expect, it } from "vitest";
import { syncSearchFromUrl } from "./search-sync";

describe("syncSearchFromUrl", () => {
  it("keeps newer typing when its own earlier search lands late", () => {
    // The user typed "ab", the debounce sent it, and the user kept typing "abc".
    expect(syncSearchFromUrl({ urlTerm: "ab", inputText: "abc", pending: ["ab"] })).toEqual({
      inputText: "abc",
      pending: [],
    });
  });

  it("keeps later searches pending when an earlier one lands", () => {
    expect(
      syncSearchFromUrl({ urlTerm: "ab", inputText: "abcd", pending: ["ab", "abc"] })
    ).toEqual({ inputText: "abcd", pending: ["abc"] });
  });

  it("drops searches the router skipped when a later one lands", () => {
    expect(
      syncSearchFromUrl({ urlTerm: "abc", inputText: "abc", pending: ["ab", "abc"] })
    ).toEqual({ inputText: "abc", pending: [] });
  });

  it("follows an external change such as back, forward, or a dashboard link", () => {
    expect(syncSearchFromUrl({ urlTerm: "maria", inputText: "ana", pending: [] })).toEqual({
      inputText: "maria",
      pending: [],
    });
  });

  it("follows an external clear of the search", () => {
    expect(syncSearchFromUrl({ urlTerm: "", inputText: "ana", pending: [] })).toEqual({
      inputText: "",
      pending: [],
    });
  });

  it("follows an external change even while a search of its own is in flight", () => {
    expect(syncSearchFromUrl({ urlTerm: "luis", inputText: "anab", pending: ["ana"] })).toEqual({
      inputText: "luis",
      pending: [],
    });
  });

  it("keeps the typed spacing when the URL holds the same term", () => {
    expect(syncSearchFromUrl({ urlTerm: "ana maria", inputText: "ana  maria ", pending: [] }))
      .toEqual({ inputText: "ana  maria ", pending: [] });
  });
});
