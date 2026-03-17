import { render, screen } from "@testing-library/react";
import EmptyState from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("제목을 표시한다", () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="빈 상태입니다"
      />
    );
    expect(screen.getByText("빈 상태입니다")).toBeInTheDocument();
  });

  it("설명을 표시한다", () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="빈 상태"
        description="상세 설명입니다"
      />
    );
    expect(screen.getByText("상세 설명입니다")).toBeInTheDocument();
  });

  it("아이콘을 렌더링한다", () => {
    render(
      <EmptyState
        icon={<span data-testid="empty-icon">icon</span>}
        title="빈 상태"
      />
    );
    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
  });

  it("액션 버튼을 렌더링한다", () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="빈 상태"
        action={<button>행동하기</button>}
      />
    );
    expect(screen.getByText("행동하기")).toBeInTheDocument();
  });
});
