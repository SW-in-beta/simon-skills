import { formatRelativeTime, cn } from "@/lib/utils";

describe("formatRelativeTime", () => {
  it("방금 전을 올바르게 표시한다", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("방금 전");
  });

  it("분 단위를 올바르게 표시한다", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5분 전");
  });

  it("시간 단위를 올바르게 표시한다", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe("2시간 전");
  });

  it("일 단위를 올바르게 표시한다", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe("3일 전");
  });

  it("주 단위를 올바르게 표시한다", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoWeeksAgo)).toBe("2주 전");
  });
});

describe("cn", () => {
  it("여러 클래스를 결합한다", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("falsy 값을 필터링한다", () => {
    expect(cn("foo", false, "bar", null, undefined)).toBe("foo bar");
  });

  it("빈 문자열을 필터링한다", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("단일 클래스를 반환한다", () => {
    expect(cn("foo")).toBe("foo");
  });
});
