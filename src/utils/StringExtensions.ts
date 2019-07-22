String.prototype.format = function() {
  const args = arguments;
  return this.replace(/{(\d+)}/g, function(match: string, index: number) {
    return typeof args[index] !== "undefined" ? args[index] : match;
  });
};
