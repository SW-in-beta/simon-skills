import {
  registerSchema,
  loginSchema,
  commentCreateSchema,
  profileUpdateSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  it("유효한 입력을 통과시킨다", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("잘못된 이메일을 거부한다", () => {
    const result = registerSchema.safeParse({
      email: "invalid",
      username: "testuser",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("짧은 사용자명을 거부한다", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "ab",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("특수문자가 포함된 사용자명을 거부한다", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "test user!",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("밑줄이 포함된 사용자명을 허용한다", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "test_user",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("짧은 비밀번호를 거부한다", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "testuser",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("유효한 입력을 통과시킨다", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("빈 비밀번호를 거부한다", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("commentCreateSchema", () => {
  it("유효한 댓글을 통과시킨다", () => {
    const result = commentCreateSchema.safeParse({ content: "좋은 사진이네요!" });
    expect(result.success).toBe(true);
  });

  it("빈 댓글을 거부한다", () => {
    const result = commentCreateSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("500자 초과 댓글을 거부한다", () => {
    const result = commentCreateSchema.safeParse({ content: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("유효한 프로필 데이터를 통과시킨다", () => {
    const result = profileUpdateSchema.safeParse({
      displayName: "테스트 유저",
      bio: "안녕하세요",
    });
    expect(result.success).toBe(true);
  });

  it("빈 필드를 허용한다 (optional)", () => {
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("200자 초과 자기소개를 거부한다", () => {
    const result = profileUpdateSchema.safeParse({ bio: "a".repeat(201) });
    expect(result.success).toBe(false);
  });
});
