import { render, screen } from "@testing-library/react";
import Avatar from "@/components/ui/Avatar";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string; src: string; [key: string]: unknown }) => (
    <img alt={props.alt} src={props.src} data-testid="avatar-image" />
  ),
}));

describe("Avatar", () => {
  it("이미지가 있으면 이미지를 표시한다", () => {
    render(<Avatar src="/test.jpg" alt="testuser" />);
    expect(screen.getByTestId("avatar-image")).toBeInTheDocument();
  });

  it("이미지가 없으면 이니셜을 표시한다", () => {
    render(<Avatar alt="testuser" />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("null 이미지에서 이니셜을 표시한다", () => {
    render(<Avatar src={null} alt="hello" />);
    expect(screen.getByText("H")).toBeInTheDocument();
  });
});
