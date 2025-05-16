import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import SignatureCanvas from 'react-native-signature-canvas';

const SignaturePad = ({ onSave, onCancel }) => {
  const signatureRef = useRef();
  const [isSigned, setIsSigned] = useState(false);

  // Handle when signature is completed
  const handleSignatureEnd = () => {
    setIsSigned(true);
  };

  // Handle saving the signature
  const handleSave = () => {
    if (signatureRef.current) {
      // Get base64 encoded PNG image of signature
      signatureRef.current.readSignature();
    }
  };

  // Handle signature data from canvas
  const handleSignatureData = (signature) => {
    // Pass base64 data back to parent component
    onSave(signature);
  };

  // Handle clearing the signature
  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
      setIsSigned(false);
    }
  };

  const style = `.m-signature-pad--footer {display: none; margin: 0px;}
                 .m-signature-pad {border: none; box-shadow: none;}
                 body,html {
                   width: 100%; height: 100%;
                 }
                 .signature-pad {box-shadow: 0 1px 3px rgba(0,0,0,0.1);}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Document</Text>
      <Text style={styles.instructions}>
        Please sign in the area below using your finger or stylus
      </Text>
      
      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleSignatureData}
          onEnd={handleSignatureEnd}
          descriptionText="Sign"
          clearText="Clear"
          confirmText="Save"
          webStyle={style}
          backgroundColor="white"
          penColor="black"
          strokeWidth={2}
          minWidth={1.5}
          maxWidth={3}
          canvasStyle={styles.signature}
          autoClear={false}
        />
      </View>
      
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleClear}
          style={[styles.button, styles.clearButton]}
        >
          Clear
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          disabled={!isSigned}
        >
          Save Signature
        </Button>
        
        <Button
          mode="text"
          onPress={onCancel}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructions: {
    marginBottom: 20,
    color: '#666',
  },
  signatureContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    height: 200,
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'white',
  },
  signature: {
    height: 200,
    width: Dimensions.get('window').width - 34, // Account for container padding and border
  },
  actions: {
    marginVertical: 10,
  },
  button: {
    marginVertical: 5,
  },
  clearButton: {
    borderColor: '#e74c3c',
    borderWidth: 1,
  },
});

export default SignaturePad;