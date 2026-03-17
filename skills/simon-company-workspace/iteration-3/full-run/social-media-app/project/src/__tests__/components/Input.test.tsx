import { render, screen, fireEvent } from "@testing-library/react";
import Input from "@/components/ui/Input";

describe("Input", () => {
  it("입력 필드를 렌더링한다", () => {
    render(<Input id="test" placeholder="입력하세요" />);
    expect(screen.getByPlaceholderText("입력하세요")).toBeInTheDocument();
  });

  it("라벨을 표시한다", () => {
    render(<Input id="test" label="이메일" />);
    expect(screen.getByText("이메일")).toBeInTheDocument();
  });

  it("에러 메시지를 표시한다", () => {
    render(<Input id="test" error="필수 항목입니다" />);
    expect(screen.getByText("필수 항목입니다")).toBeInTheDocument();
  });

  it("값 변경을 처리한다", () => {
    const onChange = jest.fn();
    render(<Input id="test" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("disabled 상태를 적용한다", () => {
    render(<Input id="test" disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });
});
