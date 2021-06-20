import { Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import * as posenet from '@tensorflow-models/posenet';
import * as BABYLON from 'babylonjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  engine: BABYLON.Engine;
  camera: BABYLON.Camera;
  scene: BABYLON.Scene;
  body: BABYLON.Mesh;
  parts: any = {};
  pose: posenet.Pose = null;
  feetPosition: number;

  videoWidth = 600;
  videoHeight = 500;
  // stats = new Stats();

  guiState = {
    algorithm: 'multi-pose',
    input: {
      mobileNetArchitecture: this.isMobile() ? '0.50' : '0.75',
      outputStride: 16,
      imageScaleFactor: 0.5,
    },
    singlePoseDetection: {
      minPoseConfidence: 0.1,
      minPartConfidence: 0.5,
    },
    multiPoseDetection: {
      maxPoseDetections: 5,
      minPoseConfidence: 0.15,
      minPartConfidence: 0.1,
      nmsRadius: 30.0,
    },
    output: {
      showVideo: true,
      showSkeleton: true,
      showPoints: true,
      showBoundingBox: false,
    },
    net: null,
  };

  ngAfterViewInit() {
    // this.bindPage();
    this.babylon();
  }

  setPosition() {
    setTimeout(() => {
      console.log('ACTIVATE!');
      this.tensorflow();
    }, 3000);
  }

  tensorflow() {
    const imageScaleFactor = 0.50;
    const flipHorizontal = true;
    const outputStride = 16;
    const minPoseConfidence = 0.1;
    const minPartConfidence = 0.5;

    this.loadVideo().then(video => {
      // load the posenet model
      posenet.load().then(instance => {

        const poseDetectionFrame = async () => {
          instance.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride).then(pose => {
            if (pose.score >= minPoseConfidence) {
              // Set initial pose
              if (this.pose === null) {
                this.pose = pose;
                this.feetPosition = pose.keypoints.find(x => x.part === 'leftAnkle').position.y;
              }

              for (let i = 0; i < pose.keypoints.length; i++) {
                const keypoint = pose.keypoints[i];

                if (keypoint.score < minPartConfidence) {
                  this.parts[keypoint.part].visibility = 0;
                  continue;
                }

                if (this.parts[keypoint.part]) {
                  this.parts[keypoint.part].visibility = 1;
                  const { y, x } = keypoint.position;
                  this.parts[keypoint.part].position.x = x / 100;
                  this.parts[keypoint.part].position.y = (y / 100) * -1;

                  if (keypoint.part === 'leftAnkle') {
                    if (this.feetPosition - y > 10) {
                      console.log('LIFT!!', y);
                    }
                  }
                }
              }
            }
          });

          requestAnimationFrame(poseDetectionFrame);
        };

        poseDetectionFrame();

      });
    });
  }

  babylon() {
    const createScene = (): void => {

      // This creates a basic Babylon Scene object (non-mesh)
      this.scene = new BABYLON.Scene(this.engine);

      // This creates and positions a free camera (non-mesh)
      this.camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 0, -10), this.scene);

      // this.updateCameraAspectRatio();

      // TODO: what does this do
      // This targets the camera to scene origin
      // camera.setTarget(Vector3.Zero());

      // This attaches the camera to the canvas
      this.camera.attachControl(this.canvas.nativeElement, true);

      // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
      // const light = new BABYLON.PointLight('pointLight', new Vector3(0, 100, 100), this.scene);
      const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene);
      light.intensity = 0.7;

      this.parts['parent'] = BABYLON.Mesh.CreateBox('parent', 5, this.scene);

      this.parts['nose'] = BABYLON.Mesh.CreateBox('nose', 0.5, this.scene);
      this.parts['leftEye'] = BABYLON.Mesh.CreateBox('leftEye', 0.5, this.scene);
      this.parts['rightEye'] = BABYLON.Mesh.CreateBox('rightEye', 0.5, this.scene);
      this.parts['leftEar'] = BABYLON.Mesh.CreateBox('leftEar', 0.5, this.scene);
      this.parts['rightEar'] = BABYLON.Mesh.CreateBox('rightEar', 0.5, this.scene);
      this.parts['leftShoulder'] = BABYLON.Mesh.CreateBox('leftShoulder', 0.5, this.scene);
      this.parts['rightShoulder'] = BABYLON.Mesh.CreateBox('rightShoulder', 0.5, this.scene);
      this.parts['leftElbow'] = BABYLON.Mesh.CreateBox('leftElbow', 0.5, this.scene);
      this.parts['rightElbow'] = BABYLON.Mesh.CreateBox('rightElbow', 0.5, this.scene);
      this.parts['leftWrist'] = BABYLON.Mesh.CreateBox('leftWrist', 0.5, this.scene);
      this.parts['rightWrist'] = BABYLON.Mesh.CreateBox('rightWrist', 0.5, this.scene);
      this.parts['leftHip'] = BABYLON.Mesh.CreateBox('leftHip', 0.5, this.scene);
      this.parts['rightHip'] = BABYLON.Mesh.CreateBox('rightHip', 0.5, this.scene);
      this.parts['leftKnee'] = BABYLON.Mesh.CreateBox('leftKnee', 0.5, this.scene);
      this.parts['rightKnee'] = BABYLON.Mesh.CreateBox('rightKnee', 0.5, this.scene);
      this.parts['leftAnkle'] = BABYLON.Mesh.CreateBox('leftAnkle', 0.5, this.scene);
      this.parts['rightAnkle'] = BABYLON.Mesh.CreateBox('rightAnkle', 0.5, this.scene);

      for (const key in this.parts) {
        if (this.parts.hasOwnProperty(key)) {
          const part = this.parts[key] as BABYLON.Mesh;
          (<BABYLON.Mesh>this.parts['parent']).addChild(part);
        }
      }

      // Below approach or this canvas.addEventListener('resize', () => {}) ?
      // this.engine.onResizeObservable.add(() => {
      //   this.updateCameraAspectRatio();
      // });
    };

    this.engine = new BABYLON.Engine(this.canvas.nativeElement, true, { preserveDrawingBuffer: true, stencil: true });
    createScene();

    // Debug
    // this.scene.debugLayer.show();

    // TODO: should I be doing this here and in the asset loader?
    this.engine.runRenderLoop(() => {
      if (this.scene) {
        this.scene.render();
      }
    });

    // Resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  isiOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  isMobile() {
    return this.isAndroid() || this.isiOS();
  }

  async setupCamera(): Promise<any> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const video = document.getElementById('video') as any;
    video.width = this.videoWidth;
    video.height = this.videoHeight;

    const mobile = this.isMobile();
    const stream = await navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': {
        facingMode: 'user',
        width: mobile ? undefined : this.videoWidth,
        height: mobile ? undefined : this.videoHeight,
      },
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }

  async loadVideo() {
    const video = await this.setupCamera();
    video.play();

    return video;
  }

  /**
   * Sets up dat.gui controller on the top-right of the window
   */
  // setupGui(cameras, net) {
  //   this.guiState.net = net;

  //   if (cameras.length > 0) {
  //     this.guiState.camera = cameras[0].deviceId;
  //   }

  //   const gui = new dat.GUI({ width: 300 });

  //   // The single-pose algorithm is faster and simpler but requires only one
  //   // person to be in the frame or results will be innaccurate. Multi-pose works
  //   // for more than 1 person
  //   const algorithmController =
  //     gui.add(this.guiState, 'algorithm', ['single-pose', 'multi-pose']);

  //   // The input parameters have the most effect on accuracy and speed of the
  //   // network
  //   const input = gui.addFolder('Input');
  //   // Architecture: there are a few PoseNet models varying in size and
  //   // accuracy. 1.01 is the largest, but will be the slowest. 0.50 is the
  //   // fastest, but least accurate.
  //   const architectureController = input.add(
  //     this.guiState.input, 'mobileNetArchitecture',
  //     ['1.01', '1.00', '0.75', '0.50']);
  //   // Output stride:  Internally, this parameter affects the height and width of
  //   // the layers in the neural network. The lower the value of the output stride
  //   // the higher the accuracy but slower the speed, the higher the value the
  //   // faster the speed but lower the accuracy.
  //   input.add(this.guiState.input, 'outputStride', [8, 16, 32]);
  //   // Image scale factor: What to scale the image by before feeding it through
  //   // the network.
  //   input.add(this.guiState.input, 'imageScaleFactor').min(0.2).max(1.0);
  //   input.open();

  //   // Pose confidence: the overall confidence in the estimation of a person's
  //   // pose (i.e. a person detected in a frame)
  //   // Min part confidence: the confidence that a particular estimated keypoint
  //   // position is accurate (i.e. the elbow's position)
  //   const single = gui.addFolder('Single Pose Detection');
  //   single.add(this.guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
  //   single.add(this.guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);

  //   const multi = gui.addFolder('Multi Pose Detection');
  //   multi.add(this.guiState.multiPoseDetection, 'maxPoseDetections')
  //     .min(1)
  //     .max(20)
  //     .step(1);
  //   multi.add(this.guiState.multiPoseDetection, 'minPoseConfidence', 0.0, 1.0);
  //   multi.add(this.guiState.multiPoseDetection, 'minPartConfidence', 0.0, 1.0);
  //   // nms Radius: controls the minimum distance between poses that are returned
  //   // defaults to 20, which is probably fine for most use cases
  //   multi.add(this.guiState.multiPoseDetection, 'nmsRadius').min(0.0).max(40.0);
  //   multi.open();

  //   const output = gui.addFolder('Output');
  //   output.add(this.guiState.output, 'showVideo');
  //   output.add(this.guiState.output, 'showSkeleton');
  //   output.add(this.guiState.output, 'showPoints');
  //   output.add(this.guiState.output, 'showBoundingBox');
  //   output.open();


  //   architectureController.onChange(function (architecture) {
  //     this.guiState.changeToArchitecture = architecture;
  //   });

  //   algorithmController.onChange(function (value) {
  //     switch (this.guiState.algorithm) {
  //       case 'single-pose':
  //         multi.close();
  //         single.open();
  //         break;
  //       case 'multi-pose':
  //         single.close();
  //         multi.open();
  //         break;
  //     }
  //   });
  // }

  /**
   * Sets up a frames per second panel on the top-left of the window
   */
  // setupFPS() {
  //   stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  //   document.body.appendChild(stats.dom);
  // }

  /**
   * Feeds an image to posenet to estimate poses - this is where the magic
   * happens. This function loops with a requestAnimationFrame method.
   */
  detectPoseInRealTime(video, net) {
    const canvas = document.getElementById('output') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    // since images are being fed from a webcam
    const flipHorizontal = true;

    canvas.width = this.videoWidth;
    canvas.height = this.videoHeight;

    async function poseDetectionFrame() {
      if (this.guiState.changeToArchitecture) {
        // Important to purge variables and free up GPU memory
        this.guiState.net.dispose();

        // Load the PoseNet model weights for either the 0.50, 0.75, 1.00, or 1.01
        // version
        // this.guiState.net = await posenet.load(+this.guiState.changeToArchitecture);

        this.guiState.changeToArchitecture = null;
      }

      // Begin monitoring code for frames per second
      this.stats.begin();

      // Scale an image down to a certain factor. Too large of an image will slow
      // down the GPU
      const imageScaleFactor = this.guiState.input.imageScaleFactor;
      const outputStride = +this.guiState.input.outputStride;

      let poses = [];
      let minPoseConfidence;
      let minPartConfidence;
      switch (this.guiState.algorithm) {
        case 'single-pose':
          const pose = await this.guiState.net.estimateSinglePose(
            video, imageScaleFactor, flipHorizontal, outputStride);
          poses.push(pose);

          minPoseConfidence = +this.guiState.singlePoseDetection.minPoseConfidence;
          minPartConfidence = +this.guiState.singlePoseDetection.minPartConfidence;
          break;
        case 'multi-pose':
          poses = await this.guiState.net.estimateMultiplePoses(
            video, imageScaleFactor, flipHorizontal, outputStride,
            this.guiState.multiPoseDetection.maxPoseDetections,
            this.guiState.multiPoseDetection.minPartConfidence,
            this.guiState.multiPoseDetection.nmsRadius);

          minPoseConfidence = +this.guiState.multiPoseDetection.minPoseConfidence;
          minPartConfidence = +this.guiState.multiPoseDetection.minPartConfidence;
          break;
      }

      ctx.clearRect(0, 0, this.videoWidth, this.videoHeight);

      if (this.guiState.output.showVideo) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-this.videoWidth, 0);
        ctx.drawImage(video, 0, 0, this.videoWidth, this.videoHeight);
        ctx.restore();
      }

      // For each pose (i.e. person) detected in an image, loop through the poses
      // and draw the resulting skeleton and keypoints if over certain confidence
      // scores
      poses.forEach(({ score, keypoints }) => {
        if (score >= minPoseConfidence) {
          if (this.guiState.output.showPoints) {
            this.drawKeypoints(keypoints, minPartConfidence, ctx);
          }
          if (this.guiState.output.showSkeleton) {
            this.drawSkeleton(keypoints, minPartConfidence, ctx);
          }
          if (this.guiState.output.showBoundingBox) {
            this.drawBoundingBox(keypoints, ctx);
          }
        }
      });

      // End monitoring code for frames per second
      this.stats.end();

      requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
  }

  /**
   * Kicks off the demo by loading the posenet model, finding and loading
   * available camera devices, and setting off the detectPoseInRealTime function.
   */
  async bindPage() {
    // Load the PoseNet model weights with architecture 0.75
    const net = await posenet.load(0.75);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('main').style.display = 'block';

    let video;

    try {
      video = await this.loadVideo();
    } catch (e) {
      const info = document.getElementById('info');
      info.textContent = 'this browser does not support video capture,' +
        'or this device does not have a camera';
      info.style.display = 'block';
      throw e;
    }

    // this.setupGui([], net);
    // this.setupFPS();
    this.detectPoseInRealTime(video, net);
  }
}
