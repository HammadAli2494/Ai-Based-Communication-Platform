export default function ModelInfoPanel({ modelInfo }) {
  if (!modelInfo) return null;

  return (
    <div className="model-info">
      <h3>{modelInfo.modelName}</h3>

      <p>
        <strong>Input:</strong> {modelInfo.input}
      </p>
      <p>
        <strong>Supported Signs:</strong> {modelInfo.supportedSigns}
      </p>
      <p>
        <strong>Inference:</strong> {modelInfo.inference}
      </p>
      <p>
        <strong>NLP:</strong> {modelInfo.nlp}
      </p>
      <p>
        <strong>Accessibility:</strong> {modelInfo.accessibility}
      </p>
    </div>
  );
}