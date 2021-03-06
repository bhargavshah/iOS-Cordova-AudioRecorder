        function Encoder( args ) {

            function encodeSPXB64( samples, spxQuality ) {     
                var workerBlob = URL.createObjectURL( new Blob([ '(', 
                    function() {
                        self.addEventListener('message', function(e) {
                            //Use this for emulator
                            // importScripts(e.data.baseURL + '/Users/pearson/Documents/Bhargav/hello/www/js/speex.min.js');
                            // Use this for iPad
                            importScripts(e.data.baseURL + '/sampletest/speex.min.js');
                            var samples = e.data.samples;
                            var spx = new Speex( { quality: e.data.spxQuality } ); 
                            var shorts = new Int16Array( samples.length );
                            for( var i = 0; i < samples.length; i++ ) {
                                shorts[ i ] = Math.floor( Math.min( 1.0, Math.max( -1.0, samples[ i ] ) ) * 32767 );
                            }
                            var enc = spx.encode( shorts, true );
                            var bytes = enc[ 0 ];
                            var binary = "";

                            for( var i = 0; i < bytes.length; i++ ) {
                                binary += String.fromCharCode( bytes[ i ] );
                            }

                            self.postMessage(binary);
                        });
                    }.toString(), ')()' ], { type: 'application/javascript' })
                );

                var worker = new Worker( workerBlob );

                worker.addEventListener('message', function(e) {
                    var b64SPX = window.btoa(e.data);
                    $(document).trigger( 'tn.recorder.encoded', {'data':[ b64SPX ],answered:true }  );
                });

                var baseURL = window.location.origin + '/tei';

                if(window.TN8) {
                    if (TN8.baseUrl) {
                        baseURL = TN8.baseUrl;
                    }
                    else {
                        baseURL = window.location.origin + '/client';
                    }
                }

                // Use this for emulator
                // worker.postMessage( { 'samples': samples, 'spxQuality': spxQuality, 'baseURL': window.location.origin } );
                // Use this for iPad
                worker.postMessage( { 'samples': samples, 'spxQuality': spxQuality, 'baseURL': "http://172.21.74.111:8080" } );
                URL.revokeObjectURL( workerBlob );
            };

            function encodeWAVB64( data ) {
                var wavData = encodeWAV( interleave( data, data ) );
                return bufferToB64( wavData.buffer );
            };
            
            function encodeB64( bytes ) {
            };

            function bufferToB64( buffer ) {
                var bytes = new Uint8Array( buffer );
                return encodeB64( bytes );
            }

            function encodeWAV( samples ) {
                var buffer = new ArrayBuffer( 44 + samples.length * 2 );
                var sampleRate = 44100;
                var view = new DataView( buffer );

                /* RIFF identifier */
                writeString( view, 0, 'RIFF' );
                /* RIFF chunk length */
                view.setUint32( 4, 36 + samples.length * 2, true );
                /* RIFF type */
                writeString( view, 8, 'WAVE' );
                /* format chunk identifier */
                writeString( view, 12, 'fmt ' );
                /* format chunk length */
                view.setUint32( 16, 16, true );
                /* sample format (raw) */
                view.setUint16( 20, 1, true );
                /* channel count */
                view.setUint16( 22, 2, true );
                /* sample rate */
                view.setUint32( 24, sampleRate, true );
                /* byte rate (sample rate * block align) */
                view.setUint32( 28, sampleRate * 4, true );
                /* block align (channel count * bytes per sample) */
                view.setUint16( 32, 4, true );
                /* bits per sample */
                view.setUint16( 34, 16, true );
                /* data chunk identifier */
                writeString( view, 36, 'data' );
                /* data chunk length */
                view.setUint32( 40, samples.length * 2, true );

                floatTo16BitPCM( view, 44, samples );
                
                return view;
            };

            function interleave( inputL, inputR ) {
                var length = inputL.length + inputR.length;
                var result = new Float32Array( length );
                var index = 0,
                inputIndex = 0;

                while ( index < length ) {
                    result[ index++ ] = inputL[ inputIndex ];
                    result[ index++ ] = inputR[ inputIndex ];
                    inputIndex++;
                }
                return result;
            }                       

            function floatTo16BitPCM( output, offset, input ) {
                for ( var i = 0; i < input.length; i++, offset += 2 ) {
                    var s = Math.max( -1, Math.min( 1, input[ i ] ) );
                    output.setInt16( offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true );
                }
            };

            function writeString( view, offset, string ) {
                for ( var i = 0; i < string.length; i++ ){
                    view.setUint8( offset + i, string.charCodeAt( i ) );
                }
            };                              

            return {
                encodeSPXB64: encodeSPXB64,
                encodeWAVB64: encodeWAVB64
            };

        }
