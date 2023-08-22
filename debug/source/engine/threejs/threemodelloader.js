import { Direction } from '../geometry/geometry.js';
import { Importer } from '../import/importer.js';
import { RevokeObjectUrl } from '../io/bufferutils.js';
import { ConvertModelToThreeObject, ModelToThreeConversionOutput, ModelToThreeConversionParams } from './threeconverter.js';
import { ConvertColorToThreeColor, HasHighpDriverIssue } from './threeutils.js';

import * as THREE from 'three';


// 构造函数：
// constructor()：构造函数初始化了 ThreeModelLoader 类的实例。
// 创建了一个 Importer 实例，用于导入模型。
// 初始化了一些属性，包括 inProgress（表示加载是否正在进行）、defaultMaterial（默认材质）、objectUrls（用于存储对象的URL）和 hasHighpDriverIssue（检查是否存在高精度渲染问题）。
// InProgress 方法：
// InProgress()：返回当前加载是否正在进行的状态。
// LoadModel 方法：
// LoadModel(inputFiles, settings, callbacks)：加载模型的方法，接受输入文件、设置选项和回调函数。
// 在加载过程中，首先检查是否有其他加载任务正在进行，如果有，则返回。
// 设置 inProgress 为 true，表示加载正在进行中。
// 调用 RevokeObjectUrls 方法，用于撤销之前创建的对象URL。
// 调用 importer.ImportFiles 方法来导入输入文件，传递了一系列回调函数，用于处理不同加载阶段的操作。
// 当导入成功后，将导入的模型转换为 Three.js 中的对象，并执行相应的回调函数。（ the key of the code）
// GetImporter 方法：
// GetImporter()：返回 Importer 实例，用于获取导入模型的引擎。
// GetDefaultMaterial 和 ReplaceDefaultMaterialColor 方法：
// GetDefaultMaterial()：返回默认材质。
// ReplaceDefaultMaterialColor(defaultColor)：替换默认材质的颜色，如果默认材质存在且不使用顶点颜色。
// RevokeObjectUrls 方法：
// RevokeObjectUrls()：撤销之前创建的对象URL，防止内存泄漏。遍历 objectUrls 数组，使用 RevokeObjectUrl 方法来撤销URL。
// Destroy 方法：
// Destroy()：销毁方法，用于撤销对象URL并将 importer 设置为 null。
// 综上所述，ThreeModelLoader 类封装了模型的加载、转换和管理操作，提供了一些实用的方法来获取导入引擎、默认材质，以及处理对象URL的管理和销毁。它在加载和处理模型时与外部代码通过回调函数进行交互，以确保加载和显示模型的顺利进行。

export class ThreeModelLoader
{
    constructor ()
    {
        this.importer = new Importer ();
        this.inProgress = false;
        this.defaultMaterial = null;
        this.objectUrls = null;
        this.hasHighpDriverIssue = HasHighpDriverIssue ();
    }

    InProgress ()
    {
        return this.inProgress;
    }

    LoadModel (inputFiles, settings, callbacks)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        this.RevokeObjectUrls ();
        this.importer.ImportFiles (inputFiles, settings, {
            onLoadStart : () => {
                callbacks.onLoadStart ();
            },
            onFileListProgress : (current, total) => {
                callbacks.onFileListProgress (current, total);
            },
            onFileLoadProgress : (current, total) => {
                callbacks.onFileLoadProgress (current, total);
            },
            onImportStart : () => {
                callbacks.onImportStart ();
            },
            onSelectMainFile : (fileNames, selectFile) => {
                if (!callbacks.onSelectMainFile) {
                    selectFile (0);
                } else {
                    callbacks.onSelectMainFile (fileNames, selectFile);
                }
            },
            onImportSuccess : (importResult) => {

                // 这段代码块的作用是根据导入结果中的 upVector 属性来调整三维模型的方向，并在处理完模型后触发相应的回调函数。我会一步步解释每个部分的含义：
                // this.defaultMaterial = output.defaultMaterial;
                // 将输出中的 defaultMaterial 赋值给类实例的 defaultMaterial 属性。这可能是用来管理默认材质的属性。
                // this.objectUrls = output.objectUrls;
                // 将输出中的 objectUrls 赋值给类实例的 objectUrls 属性。这是用来存储对象URL的数组，用于后续的撤销操作。
                // 条件语句根据 importResult.upVector 的值来确定旋转方向：
                // if (importResult.upVector === Direction.X)：如果 upVector 是 Direction.X，表示模型的上方向是X轴方向。
                // else if (importResult.upVector === Direction.Z)：如果 upVector 是 Direction.Z，表示模型的上方向是Z轴方向。
                // 旋转模型的方向：
                // 使用 THREE.Quaternion 来创建一个四元数，setFromAxisAngle 方法将旋转轴和旋转角度（这里是 Math.PI / 2.0 或 -Math.PI / 2.0）转换为四元数表示。
                // new THREE.Vector3 (0.0, 0.0, 1.0) 表示旋转轴，这是一个指向Z轴的单位向量（用于X轴方向的旋转）。
                // new THREE.Vector3 (1.0, 0.0, 0.0) 表示旋转轴，这是一个指向X轴的单位向量（用于Z轴方向的旋转）。
                // threeObject.quaternion.multiply(rotation); 旋转 threeObject 的四元数（表示模型的旋转）。
                // 触发回调函数：
                // callbacks.onModelFinished(importResult, threeObject); 调用传递的 onModelFinished 回调函数，传入导入结果 importResult 和经过旋转的 threeObject。
                // this.inProgress = false; 设置 inProgress 属性为 false，表示加载过程结束。

                callbacks.onVisualizationStart ();
                // 将导入的模型转换为 Three.js 中的对象，并执行相应的回调函数。
                let params = new ModelToThreeConversionParams ();
                params.forceMediumpForMaterials = this.hasHighpDriverIssue;
                let output = new ModelToThreeConversionOutput ();
                console.log('test-new ModelToThreeConversionParams ()', params, '\n', 'test-importResult', importResult.model, '\n', 'test-output', output);

                ConvertModelToThreeObject (importResult.model, params, output, {
                    onTextureLoaded : () => {
                        callbacks.onTextureLoaded ();
                    },
                    onModelLoaded : (threeObject) => {
                        this.defaultMaterial = output.defaultMaterial;
                        this.objectUrls = output.objectUrls;

                        // 设置3d 模型的初始位置；
                        if (importResult.upVector === Direction.X) {
                            let rotation = new THREE.Quaternion ().setFromAxisAngle (new THREE.Vector3 (0.0, 1.0, 1.0), Math.PI / 2.0);
                            threeObject.quaternion.multiply (rotation);
                        } else if (importResult.upVector === Direction.Z) {
                            let rotation = new THREE.Quaternion ().setFromAxisAngle (new THREE.Vector3 (1.0, 0.0, 0.0), -Math.PI / 2.0);
                            threeObject.quaternion.multiply (rotation);
                        }
                        callbacks.onModelFinished (importResult, threeObject);
                        this.inProgress = false;
                    }
                });
            },
            onImportError : (importError) => {
                callbacks.onLoadError (importError);
                this.inProgress = false;
            }
        });
    }

    GetImporter ()
    {
        return this.importer;
    }

    GetDefaultMaterial ()
    {
        return this.defaultMaterial;
    }

    ReplaceDefaultMaterialColor (defaultColor)
    {
        if (this.defaultMaterial !== null && !this.defaultMaterial.vertexColors) {
            this.defaultMaterial.color = ConvertColorToThreeColor (defaultColor);
        }
    }

    RevokeObjectUrls ()
    {
        if (this.objectUrls === null) {
            return;
        }
        for (let objectUrl of this.objectUrls) {
            RevokeObjectUrl (objectUrl);
        }
        this.objectUrls = null;
    }

    Destroy ()
    {
        this.RevokeObjectUrls ();
        this.importer = null;
    }
}
