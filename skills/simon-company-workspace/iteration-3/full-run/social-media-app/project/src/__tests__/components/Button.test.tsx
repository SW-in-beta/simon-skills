import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/ui/Button";

// Mock lucide-react
jest.mock("lucide-react", () => ({
  Loader2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="loader" {...props} />
  ),
}));

describe("Button", () => {
  it("기본 버튼을 렌더링한다", () => {
    render(<Button>클릭</Button>);
    expect(screen.getByText("클릭")).toBeInTheDocument();
  });

  it("클릭 이벤트를 처리한다", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    fireEvent.click(screen.getByText("클릭"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled 상태에서 클릭을 무시한다", () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        클릭
      </Button>
    );
    fireEvent.click(screen.getByText("클릭"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading 상태에서 스피너를 표시한다", () => {
    render(<Button loading>로딩</Button>);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("loading 상태에서 disabled가 된다", () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} loading>
        로딩
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("fullWidth 클래스를 적용한다", () => {
    render(<Button fullWidth>전체 너비</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("w-full");
  });
});
