export function generateRandomColor(): string {
    // Using a set of distinct, visually differentiable colors
    const colors = [
      "#FF5733", // Red-Orange
      "#33FF57", // Green
      "#3357FF", // Blue
      "#FF33A8", // Pink
      "#33FFF0", // Cyan
      "#F033FF", // Magenta
      "#FFD733", // Yellow
      "#8E33FF", // Purple
      "#FF8E33", // Orange
      "#33FFAA", // Mint
      "#FF3333", // Red
      "#33AAFF", // Sky Blue
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }