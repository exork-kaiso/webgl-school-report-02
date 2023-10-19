// 必要なモジュールを読み込み
import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

// DOM がパースされたことを検出するイベントで App3 クラスをインスタンス化する
window.addEventListener(
	'DOMContentLoaded',
	() => {
		const app = new App3();
		app.init();
		app.render();
	},
	false
);

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
	/**
	 * カメラ定義のための定数
	 */
	static get CAMERA_PARAM() {
		return {
			fovy: 60,
			aspect: window.innerWidth / window.innerHeight,
			near: 0.1,
			far: 20.0,
			x: 10.0,
			y: 10.0,
			z: 10.0,
			lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
		};
	}
	/**
	 * レンダラー定義のための定数
	 */
	static get RENDERER_PARAM() {
		return {
			clearColor: 0x666666,
			width: window.innerWidth,
			height: window.innerHeight,
		};
	}
	/**
	 * ディレクショナルライト定義のための定数
	 */
	static get DIRECTIONAL_LIGHT_PARAM() {
		return {
			color: 0xffffff, // 光の色
			intensity: 1.0, // 光の強度
			x: 1.0, // 光の向きを表すベクトルの X 要素
			y: 1.0, // 光の向きを表すベクトルの Y 要素
			z: 1.0, // 光の向きを表すベクトルの Z 要素
		};
	}
	/**
	 * アンビエントライト定義のための定数
	 */
	static get AMBIENT_LIGHT_PARAM() {
		return {
			color: 0xffffff, // 光の色
			intensity: 0.2, // 光の強度
		};
	}

	static get MATERIAL_PARAM_RED() {
		return {
			color: 0xff3333, // マテリアルの基本色
		};
	}

	static get MATERIAL_PARAM_GREEN() {
		return {
			color: 0x228822, // マテリアルの基本色
		};
	}

	static get MATERIAL_PARAM_BLUE() {
		return {
			color: 0x3399ff, // マテリアルの基本色
		};
	}

	/**
	 * コンストラクタ
	 * @constructor
	 */
	constructor() {
		this.renderer; // レンダラ
		this.scene; // シーン
		this.camera; // カメラ
		this.directionalLight; // ディレクショナルライト
		this.ambientLight; // アンビエントライト
		this.material_red; // マテリアル
		this.material_green; // マテリアル
		this.material_blue; // マテリアル

		// 扇風機の土台
		this.fanBaseGeometry;
		this.fanBase;

		// 扇風機の支柱
		this.fanPropGeometry;
		this.fanProp;

		// 扇風機の胴体
		this.fanBodyGeometry;
		this.fanBody;

		// 扇風機の胴体のオフセット
		this.fanBodyOffset;
		this.fanBodyDirection;

		// 扇風機の羽根
		this.fanBladeGeometry;
		this.fanBladeArray;

		// 扇風機の羽根（1枚）のオフセット
		this.fanBlade_1_Offset;
		this.fanBlade_2_Offset;
		this.fanBlade_3_Offset;

		// 扇風機の羽根のグループのオフセット
		this.fanBladeGroup;

		this.controls; // オービットコントロール
		// this.axesHelper; // 軸ヘルパー

		this.isDown = false; // キーの押下状態を保持するフラグ

		// 再帰呼び出しのための this 固定
		this.render = this.render.bind(this);

		// キーの押下や離す操作を検出できるようにする
		window.addEventListener(
			'keydown',
			keyEvent => {
				switch (keyEvent.key) {
					case ' ':
						this.isDown = true;
						break;
					default:
				}
			},
			false
		);

		window.addEventListener(
			'keyup',
			keyEvent => {
				this.isDown = false;
			},
			false
		);

		// リサイズイベント
		window.addEventListener(
			'resize',
			() => {
				this.renderer.setSize(window.innerWidth, window.innerHeight);
				this.camera.aspect = window.innerWidth / window.innerHeight;
				this.camera.updateProjectionMatrix();
			},
			false
		);
	}

	/**
	 * 初期化処理
	 */
	init() {
		// レンダラー
		this.renderer = new THREE.WebGLRenderer();

		this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));

		this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
		const wrapper = document.querySelector('#webgl');
		wrapper.appendChild(this.renderer.domElement);

		// シーン
		this.scene = new THREE.Scene();

		// カメラ
		this.camera = new THREE.PerspectiveCamera(
			App3.CAMERA_PARAM.fovy,
			App3.CAMERA_PARAM.aspect,
			App3.CAMERA_PARAM.near,
			App3.CAMERA_PARAM.far
		);

		this.camera.position.set(App3.CAMERA_PARAM.x, App3.CAMERA_PARAM.y, App3.CAMERA_PARAM.z);

		this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

		// ディレクショナルライト（平行光源）
		this.directionalLight = new THREE.DirectionalLight(
			App3.DIRECTIONAL_LIGHT_PARAM.color,
			App3.DIRECTIONAL_LIGHT_PARAM.intensity
		);

		this.directionalLight.position.set(
			App3.DIRECTIONAL_LIGHT_PARAM.x,
			App3.DIRECTIONAL_LIGHT_PARAM.y,
			App3.DIRECTIONAL_LIGHT_PARAM.z
		);

		this.scene.add(this.directionalLight);

		// アンビエントライト（環境光）
		this.ambientLight = new THREE.AmbientLight(App3.AMBIENT_LIGHT_PARAM.color, App3.AMBIENT_LIGHT_PARAM.intensity);
		this.scene.add(this.ambientLight);

		// マテリアル
		this.material_red = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM_RED);
		this.material_green = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM_GREEN);
		this.material_blue = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM_BLUE);

		// 扇風機の土台
		// new THREE.CylinderGeometry(上底の大きさ, 下底の大きさ, 高さ, 分割数);
		this.fanBaseGeometry = new THREE.CylinderGeometry(1, 1, 0.25, 8);
		this.fanBase = new THREE.Mesh(this.fanBaseGeometry, this.material_blue);
		this.fanBase.position.set(0, 0.125, 0);
		this.scene.add(this.fanBase);

		// 扇風機の支柱
		this.fanPropGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 8);
		this.fanProp = new THREE.Mesh(this.fanPropGeometry, this.material_blue);
		this.fanProp.position.set(0, 1.5, 0);
		this.scene.add(this.fanProp);

		this.fanBodyOffset = new THREE.Group();

		// 扇風機の胴体
		this.fanBodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
		this.fanBody = new THREE.Mesh(this.fanBodyGeometry, this.material_blue);
		this.fanBodyOffset.rotation.set(Math.PI / 2, 0, 0);
		this.fanBodyOffset.position.set(0, 3, 0);

		this.fanBodyDirection = true;

		this.fanBodyOffset.add(this.fanBody);
		this.scene.add(this.fanBodyOffset);

		// 扇風機の羽根グループのオフセット（Group）のインスタンスを生成
		// 扇風機の羽根（1枚）のそれぞれのオフセット（Group）のインスタンスを生成
		this.fanBladeGroup = new THREE.Group();
		this.fanBlade_1_Offset = new THREE.Group();
		this.fanBlade_2_Offset = new THREE.Group();
		this.fanBlade_3_Offset = new THREE.Group();

		// 扇風機の羽根のグループのオフセットをシーンに追加
		this.fanBodyOffset.add(this.fanBladeGroup);

		// 扇風機の羽根のグループの位置と角度を調整
		this.fanBladeGroup.position.set(0, 1.25, 0);
		this.fanBladeGroup.rotation.set(0, Math.PI / 2, 0);

		// 扇風機の羽根（1枚）のそれぞれのオフセットを扇風機の羽根のグループのオフセットに追加
		this.fanBladeGroup.add(this.fanBlade_1_Offset);
		this.fanBladeGroup.add(this.fanBlade_2_Offset);
		this.fanBladeGroup.add(this.fanBlade_3_Offset);

		// 扇風機の羽根（1枚）のジオメトリを生成
		this.fanBladeGeometry = new THREE.BoxGeometry(1, 0.05, 2.5);
		this.fanBladeArray = [];

		// 扇風機の羽根（1枚）のメッシュを生成
		const fanBlade1 = new THREE.Mesh(this.fanBladeGeometry, this.material_red);
		const fanBlade2 = new THREE.Mesh(this.fanBladeGeometry, this.material_green);
		const fanBlade3 = new THREE.Mesh(this.fanBladeGeometry, this.material_blue);

		// 扇風機の羽根（1枚目）のジオメトリを生成
		this.fanBlade_1_Offset.add(fanBlade1);
		this.fanBlade_1_Offset.rotation.set(0, 0 * ((2 * Math.PI) / 3), 0.25);
		fanBlade1.position.set(0, 0, 1.25);
		this.fanBladeArray.push(fanBlade1);

		// 扇風機の羽根（2枚目）のジオメトリを生成
		this.fanBlade_2_Offset.add(fanBlade2);
		this.fanBlade_2_Offset.rotation.set(0, 1 * ((2 * Math.PI) / 3), 0.25);
		fanBlade2.position.set(0, 0, 1.25);
		this.fanBladeArray.push(fanBlade2);

		// 扇風機の羽根（3枚目）のジオメトリを生成
		this.fanBlade_3_Offset.add(fanBlade3);
		this.fanBlade_3_Offset.rotation.set(0, 2 * ((2 * Math.PI) / 3), 0.25);
		fanBlade3.position.set(0, 0, 1.25);
		this.fanBladeArray.push(fanBlade3);

		// コントロール
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		// // ヘルパー
		// const axesBarLength = 5.0;
		// this.axesHelper = new THREE.AxesHelper(axesBarLength);
		// this.scene.add(this.axesHelper);
	}

	/**
	 * 描画処理
	 */
	render() {
		// 恒常ループ
		requestAnimationFrame(this.render);

		// コントロールを更新
		this.controls.update();

		// フラグに応じてオブジェクトの状態を変化させる
		if (this.isDown === true) {
			// 扇風機の羽根のグループの回転
			this.fanBladeGroup.rotation.y += 0.3;

			// 扇風機の胴体の回転
			if (this.fanBodyDirection && this.fanBodyOffset.rotation.z < 0.75) {
				this.fanBodyOffset.rotation.z += 0.005;
			} else if (this.fanBodyDirection && this.fanBodyOffset.rotation.z > 0.75) {
				this.fanBodyDirection = false;
			} else if (!this.fanBodyDirection && this.fanBodyOffset.rotation.z > -0.75) {
				this.fanBodyOffset.rotation.z -= 0.005;
			} else if (!this.fanBodyDirection && this.fanBodyOffset.rotation.z < -0.75) {
				this.fanBodyDirection = true;
			}
		}

		// レンダラーで描画
		this.renderer.render(this.scene, this.camera);
	}
}
