const BarcodeScanner = ({ onDetected, onError }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      onError(new Error('Scanner non supporté par votre navigateur'));
      return;
    }

    let stream;
    const initScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        setCameraStream(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        
        const detector = new window.BarcodeDetector({ formats: ['ean_13'] });
        
        const detect = () => {
          if (!videoRef.current) return;
          
          detector.detect(videoRef.current)
            .then(([result]) => {
              if (result) {
                onDetected(result.rawValue);
              }
              requestAnimationFrame(detect);
            })
            .catch(err => onError(err));
        };
        
        detect();
      } catch (err) {
        onError(err);
      }
    };

    initScanner();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onDetected, onError]);

  return (
    <div style={{ width: '100%', marginTop: '10px' }}>
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          border: '2px solid #4CAF50',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};