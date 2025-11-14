import { CodeCategory, CodeType, FlowStep, LanguageOption } from '../../components/InteractiveCodeEditor';
import { PingSDKJavaScriptTemplates } from './templates/frontend/pingSDKTemplates';
import { RestApiFetchTemplates, RestApiAxiosTemplates } from './templates/frontend/restApiTemplates';
import { ReactTemplates } from './templates/frontend/reactTemplates';
import { NextJsTemplates } from './templates/frontend/nextjsTemplates';
import { AngularTemplates } from './templates/frontend/angularTemplates';
import { VueTemplates } from './templates/frontend/vueTemplates';
import { NodeJsTemplates, PythonTemplates } from './templates/backend/nodeTemplates';
import { ReactNativeTemplates, FlutterTemplates } from './templates/mobile/mobileTemplates';

export interface CodeGenerationConfig {
  category: CodeCategory;
  codeType: CodeType;
  flowStep: FlowStep;
  language: LanguageOption;
  config: {
    environmentId: string;
    clientId: string;
    redirectUri: string;
    userId: string;
  };
}

export interface GeneratedCode {
  code: string;
  language: string;
  dependencies: string[];
  description: string;
  notes?: string;
}

export class CodeGenerationService {
  generate(config: CodeGenerationConfig): GeneratedCode {
    // Route to appropriate template based on category and type
    const templateKey = `${config.category}-${config.codeType}`;
    
    switch (templateKey) {
      // Frontend
      case 'frontend-ping-sdk-js':
        return this.generateFrontendPingSDK(config);
      case 'frontend-rest-api-fetch':
        return this.generateFrontendRestApiFetch(config);
      case 'frontend-rest-api-axios':
        return this.generateFrontendRestApiAxios(config);
      case 'frontend-react':
        return this.generateFrontendReact(config);
      case 'frontend-next-js':
        return this.generateFrontendNextJs(config);
      case 'frontend-vanilla-js':
        return this.generateFrontendVanillaJs(config);
      case 'frontend-angular':
        return this.generateFrontendAngular(config);
      case 'frontend-vue':
        return this.generateFrontendVue(config);
      
      // Backend
      case 'backend-ping-sdk-node':
      case 'backend-rest-api-node':
        return this.generateBackendNodeJs(config);
      case 'backend-python-requests':
      case 'backend-python-sdk':
        return this.generateBackendPython(config);
      case 'backend-java-sdk':
      case 'backend-go-http':
      case 'backend-ruby-http':
      case 'backend-csharp-http':
        return this.generatePlaceholder(config); // TODO: Implement
      
      // Mobile
      case 'mobile-ping-sdk-ios':
        return this.generateMobilePingSDKiOS(config);
      case 'mobile-ping-sdk-android':
        return this.generateMobilePingSDKAndroid(config);
      case 'mobile-react-native':
        return this.generateMobileReactNative(config);
      case 'mobile-flutter':
        return this.generateMobileFlutter(config);
      case 'mobile-swift-native':
        return this.generateMobilePingSDKiOS(config); // Reuse iOS SDK
      case 'mobile-kotlin-native':
        return this.generateMobilePingSDKAndroid(config); // Reuse Android SDK
      
      default:
        return this.generatePlaceholder(config);
    }
  }

  private generateFrontendPingSDK(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => PingSDKJavaScriptTemplates.authorization(userConfig),
      workerToken: () => PingSDKJavaScriptTemplates.workerToken(userConfig),
      deviceSelection: () => PingSDKJavaScriptTemplates.deviceSelection(userConfig),
      mfaChallenge: () => PingSDKJavaScriptTemplates.mfaChallenge(userConfig),
      mfaVerification: () => PingSDKJavaScriptTemplates.mfaVerification(userConfig),
      deviceRegistration: () => PingSDKJavaScriptTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: flowStep === 'authorization' ? ['@pingidentity/pingone-js-sdk'] : [],
      description: this.getStepDescription(flowStep, 'Ping SDK JavaScript'),
    };
  }

  private generateFrontendRestApiFetch(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => RestApiFetchTemplates.authorization(userConfig),
      workerToken: () => RestApiFetchTemplates.workerToken(userConfig),
      deviceSelection: () => RestApiFetchTemplates.deviceSelection(userConfig),
      mfaChallenge: () => RestApiFetchTemplates.mfaChallenge(userConfig),
      mfaVerification: () => RestApiFetchTemplates.mfaVerification(userConfig),
      deviceRegistration: () => RestApiFetchTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: [],
      description: this.getStepDescription(flowStep, 'REST API (Fetch)'),
    };
  }

  private generateFrontendRestApiAxios(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => RestApiAxiosTemplates.authorization(userConfig),
      workerToken: () => RestApiAxiosTemplates.workerToken(userConfig),
      deviceSelection: () => RestApiAxiosTemplates.deviceSelection(userConfig),
      mfaChallenge: () => RestApiAxiosTemplates.mfaChallenge(userConfig),
      mfaVerification: () => RestApiAxiosTemplates.mfaVerification(userConfig),
      deviceRegistration: () => RestApiAxiosTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: ['axios'],
      description: this.getStepDescription(flowStep, 'REST API (Axios)'),
    };
  }

  private generateFrontendReact(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => ReactTemplates.authorization(userConfig),
      workerToken: () => ReactTemplates.workerToken(userConfig),
      deviceSelection: () => ReactTemplates.deviceSelection(userConfig),
      mfaChallenge: () => ReactTemplates.mfaChallenge(userConfig),
      mfaVerification: () => ReactTemplates.mfaVerification(userConfig),
      deviceRegistration: () => ReactTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: ['react', 'react-dom'],
      description: this.getStepDescription(flowStep, 'React'),
    };
  }

  private generateFrontendNextJs(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => NextJsTemplates.authorization(userConfig),
      workerToken: () => NextJsTemplates.workerToken(userConfig),
      deviceSelection: () => NextJsTemplates.deviceSelection(userConfig),
      mfaChallenge: () => NextJsTemplates.mfaChallenge(userConfig),
      mfaVerification: () => NextJsTemplates.mfaVerification(userConfig),
      deviceRegistration: () => NextJsTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: ['next', 'react', 'react-dom'],
      description: this.getStepDescription(flowStep, 'Next.js'),
    };
  }

  private generateFrontendVanillaJs(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    
    // Vanilla JS uses the same templates as REST API Fetch (no framework)
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => RestApiFetchTemplates.authorization(userConfig),
      workerToken: () => RestApiFetchTemplates.workerToken(userConfig),
      deviceSelection: () => RestApiFetchTemplates.deviceSelection(userConfig),
      mfaChallenge: () => RestApiFetchTemplates.mfaChallenge(userConfig),
      mfaVerification: () => RestApiFetchTemplates.mfaVerification(userConfig),
      deviceRegistration: () => RestApiFetchTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'javascript',
      dependencies: [],
      description: this.getStepDescription(flowStep, 'Vanilla JavaScript'),
    };
  }

  private generateFrontendAngular(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => AngularTemplates.authorization(userConfig),
      workerToken: () => AngularTemplates.workerToken(userConfig),
      deviceSelection: () => AngularTemplates.deviceSelection(userConfig),
      mfaChallenge: () => AngularTemplates.mfaChallenge(userConfig),
      mfaVerification: () => AngularTemplates.mfaVerification(userConfig),
      deviceRegistration: () => AngularTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: ['@angular/core', '@angular/common', '@angular/common/http', 'rxjs'],
      description: this.getStepDescription(flowStep, 'Angular'),
    };
  }

  private generateFrontendVue(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => VueTemplates.authorization(userConfig),
      workerToken: () => VueTemplates.workerToken(userConfig),
      deviceSelection: () => VueTemplates.deviceSelection(userConfig),
      mfaChallenge: () => VueTemplates.mfaChallenge(userConfig),
      mfaVerification: () => VueTemplates.mfaVerification(userConfig),
      deviceRegistration: () => VueTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: ['vue', 'pinia'],
      description: this.getStepDescription(flowStep, 'Vue.js'),
    };
  }

  private generateBackendNodeJs(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => NodeJsTemplates.authorization(userConfig),
      workerToken: () => NodeJsTemplates.workerToken(userConfig),
      deviceSelection: () => NodeJsTemplates.deviceSelection(userConfig),
      mfaChallenge: () => NodeJsTemplates.mfaChallenge(userConfig),
      mfaVerification: () => NodeJsTemplates.mfaVerification(userConfig),
      deviceRegistration: () => NodeJsTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'javascript',
      dependencies: flowStep === 'authorization' ? ['express', 'express-session', 'node-fetch'] : ['node-fetch'],
      description: this.getStepDescription(flowStep, 'Node.js Backend'),
    };
  }

  private generateBackendPython(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => PythonTemplates.authorization(userConfig),
      workerToken: () => PythonTemplates.workerToken(userConfig),
      deviceSelection: () => PythonTemplates.deviceSelection(userConfig),
      mfaChallenge: () => PythonTemplates.mfaChallenge(userConfig),
      mfaVerification: () => PythonTemplates.mfaVerification(userConfig),
      deviceRegistration: () => PythonTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'python',
      dependencies: flowStep === 'authorization' ? ['flask', 'requests'] : ['requests'],
      description: this.getStepDescription(flowStep, 'Python Backend'),
    };
  }

  private generateMobilePingSDKiOS(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    
    const templates: Record<FlowStep, string> = {
      authorization: `import PingOneSDK

// Initialize PingOne SDK for iOS
class AuthenticationManager {
    let environmentId = "${userConfig.environmentId}"
    let clientId = "${userConfig.clientId}"
    let redirectUri = "${userConfig.redirectUri}"
    
    func startAuthorization() {
        // Configure PingOne SDK
        let config = PingOneSDKConfiguration(
            environmentId: environmentId,
            clientId: clientId,
            redirectUri: redirectUri
        )
        
        // Start authorization flow with PKCE
        PingOneSDK.shared.authorize(
            configuration: config,
            scopes: ["openid", "profile", "email"]
        ) { result in
            switch result {
            case .success(let tokens):
                // Store tokens securely in Keychain
                self.storeTokens(tokens)
                print("Authorization successful")
            case .failure(let error):
                print("Authorization failed: \\(error)")
            }
        }
    }
    
    private func storeTokens(_ tokens: TokenResponse) {
        // Store in iOS Keychain
        KeychainHelper.save(tokens.accessToken, forKey: "access_token")
        KeychainHelper.save(tokens.idToken, forKey: "id_token")
    }
}`,
      workerToken: `import PingOneSDK

// Get worker token for Management API access
class WorkerTokenManager {
    let environmentId = "${userConfig.environmentId}"
    let clientId = "${userConfig.clientId}"
    let clientSecret = "YOUR_CLIENT_SECRET"
    
    func getWorkerToken(completion: @escaping (Result<String, Error>) -> Void) {
        let tokenURL = URL(string: "https://auth.pingone.com/\\(environmentId)/as/token")!
        
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        
        let body = "grant_type=client_credentials&client_id=\\(clientId)&client_secret=\\(clientSecret)"
        request.httpBody = body.data(using: .utf8)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: -1)))
                return
            }
            
            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                if let accessToken = json?["access_token"] as? String {
                    completion(.success(accessToken))
                } else {
                    completion(.failure(NSError(domain: "Invalid response", code: -1)))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}`,
      deviceSelection: `import PingOneSDK

// List and select MFA devices
class DeviceManager {
    let environmentId = "${userConfig.environmentId}"
    let userId = "${userConfig.userId}"
    
    func listDevices(accessToken: String, completion: @escaping (Result<[MFADevice], Error>) -> Void) {
        let url = URL(string: "https://api.pingone.com/v1/environments/\\(environmentId)/users/\\(userId)/devices")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: -1)))
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let response = try decoder.decode(DevicesResponse.self, from: data)
                completion(.success(response.embedded.devices))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

struct MFADevice: Codable {
    let id: String
    let type: String
    let status: String
}

struct DevicesResponse: Codable {
    let embedded: EmbeddedDevices
    
    struct EmbeddedDevices: Codable {
        let devices: [MFADevice]
    }
}`,
      mfaChallenge: `import PingOneSDK

// Send MFA challenge
class MFAChallengeManager {
    let environmentId = "${userConfig.environmentId}"
    let userId = "${userConfig.userId}"
    
    func sendChallenge(deviceId: String, accessToken: String, completion: @escaping (Result<String, Error>) -> Void) {
        let url = URL(string: "https://api.pingone.com/v1/environments/\\(environmentId)/users/\\(userId)/devices/\\(deviceId)/otp")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: -1)))
                return
            }
            
            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                if let challengeId = json?["id"] as? String {
                    completion(.success(challengeId))
                } else {
                    completion(.failure(NSError(domain: "Invalid response", code: -1)))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}`,
      mfaVerification: `import PingOneSDK

// Verify MFA code
class MFAVerificationManager {
    let environmentId = "${userConfig.environmentId}"
    let userId = "${userConfig.userId}"
    
    func verifyCode(deviceId: String, otp: String, accessToken: String, completion: @escaping (Result<Bool, Error>) -> Void) {
        let url = URL(string: "https://api.pingone.com/v1/environments/\\(environmentId)/users/\\(userId)/devices/\\(deviceId)/otp/check")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["otp": otp]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse {
                completion(.success(httpResponse.statusCode == 200))
            } else {
                completion(.failure(NSError(domain: "Invalid response", code: -1)))
            }
        }.resume()
    }
}`,
      deviceRegistration: `import PingOneSDK

// Register new MFA device
class DeviceRegistrationManager {
    let environmentId = "${userConfig.environmentId}"
    let userId = "${userConfig.userId}"
    
    func registerDevice(type: String, phoneNumber: String?, email: String?, accessToken: String, completion: @escaping (Result<String, Error>) -> Void) {
        let url = URL(string: "https://api.pingone.com/v1/environments/\\(environmentId)/users/\\(userId)/devices")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        var body: [String: Any] = ["type": type]
        if let phone = phoneNumber {
            body["phone"] = phone
        }
        if let email = email {
            body["email"] = email
        }
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: -1)))
                return
            }
            
            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                if let deviceId = json?["id"] as? String {
                    completion(.success(deviceId))
                } else {
                    completion(.failure(NSError(domain: "Invalid response", code: -1)))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}`,
    };
    
    return {
      code: templates[flowStep],
      language: 'swift',
      dependencies: flowStep === 'authorization' ? ['PingOneSDK'] : [],
      description: this.getStepDescription(flowStep, 'Ping SDK iOS (Swift)'),
    };
  }

  private generateMobilePingSDKAndroid(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    
    const templates: Record<FlowStep, string> = {
      authorization: `import com.pingidentity.pingone.PingOne
import com.pingidentity.pingone.PingOneSDKConfiguration

// Initialize PingOne SDK for Android
class AuthenticationManager(private val context: Context) {
    private val environmentId = "${userConfig.environmentId}"
    private val clientId = "${userConfig.clientId}"
    private val redirectUri = "${userConfig.redirectUri}"
    
    fun startAuthorization() {
        // Configure PingOne SDK
        val config = PingOneSDKConfiguration.Builder()
            .environmentId(environmentId)
            .clientId(clientId)
            .redirectUri(redirectUri)
            .build()
        
        // Initialize SDK
        PingOne.initialize(context, config)
        
        // Start authorization flow with PKCE
        PingOne.authorize(
            scopes = listOf("openid", "profile", "email"),
            callback = object : PingOne.AuthCallback {
                override fun onSuccess(tokens: TokenResponse) {
                    // Store tokens securely
                    storeTokens(tokens)
                    Log.d("Auth", "Authorization successful")
                }
                
                override fun onError(error: PingOneException) {
                    Log.e("Auth", "Authorization failed: \${error.message}")
                }
            }
        )
    }
    
    private fun storeTokens(tokens: TokenResponse) {
        // Store in Android Keystore
        val sharedPrefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
        sharedPrefs.edit().apply {
            putString("access_token", tokens.accessToken)
            putString("id_token", tokens.idToken)
            apply()
        }
    }
}`,
      workerToken: `import okhttp3.*
import org.json.JSONObject

// Get worker token for Management API access
class WorkerTokenManager {
    private val environmentId = "${userConfig.environmentId}"
    private val clientId = "${userConfig.clientId}"
    private val clientSecret = "YOUR_CLIENT_SECRET"
    
    fun getWorkerToken(callback: (Result<String>) -> Unit) {
        val client = OkHttpClient()
        val tokenUrl = "https://auth.pingone.com/\${environmentId}/as/token"
        
        val requestBody = FormBody.Builder()
            .add("grant_type", "client_credentials")
            .add("client_id", clientId)
            .add("client_secret", clientSecret)
            .build()
        
        val request = Request.Builder()
            .url(tokenUrl)
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }
            
            override fun onResponse(call: Call, response: Response) {
                response.body?.string()?.let { body ->
                    try {
                        val json = JSONObject(body)
                        val accessToken = json.getString("access_token")
                        callback(Result.success(accessToken))
                    } catch (e: Exception) {
                        callback(Result.failure(e))
                    }
                }
            }
        })
    }
}`,
      deviceSelection: `import okhttp3.*
import org.json.JSONObject
import org.json.JSONArray

// List and select MFA devices
class DeviceManager {
    private val environmentId = "${userConfig.environmentId}"
    private val userId = "${userConfig.userId}"
    
    fun listDevices(accessToken: String, callback: (Result<List<MFADevice>>) -> Unit) {
        val client = OkHttpClient()
        val url = "https://api.pingone.com/v1/environments/\${environmentId}/users/\${userId}/devices"
        
        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer \${accessToken}")
            .get()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }
            
            override fun onResponse(call: Call, response: Response) {
                response.body?.string()?.let { body ->
                    try {
                        val json = JSONObject(body)
                        val devicesArray = json.getJSONObject("_embedded").getJSONArray("devices")
                        val devices = mutableListOf<MFADevice>()
                        
                        for (i in 0 until devicesArray.length()) {
                            val device = devicesArray.getJSONObject(i)
                            devices.add(MFADevice(
                                id = device.getString("id"),
                                type = device.getString("type"),
                                status = device.getString("status")
                            ))
                        }
                        
                        callback(Result.success(devices))
                    } catch (e: Exception) {
                        callback(Result.failure(e))
                    }
                }
            }
        })
    }
}

data class MFADevice(
    val id: String,
    val type: String,
    val status: String
)`,
      mfaChallenge: `import okhttp3.*
import org.json.JSONObject

// Send MFA challenge
class MFAChallengeManager {
    private val environmentId = "${userConfig.environmentId}"
    private val userId = "${userConfig.userId}"
    
    fun sendChallenge(deviceId: String, accessToken: String, callback: (Result<String>) -> Unit) {
        val client = OkHttpClient()
        val url = "https://api.pingone.com/v1/environments/\${environmentId}/users/\${userId}/devices/\${deviceId}/otp"
        
        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer \${accessToken}")
            .addHeader("Content-Type", "application/json")
            .post(RequestBody.create(null, ""))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }
            
            override fun onResponse(call: Call, response: Response) {
                response.body?.string()?.let { body ->
                    try {
                        val json = JSONObject(body)
                        val challengeId = json.getString("id")
                        callback(Result.success(challengeId))
                    } catch (e: Exception) {
                        callback(Result.failure(e))
                    }
                }
            }
        })
    }
}`,
      mfaVerification: `import okhttp3.*
import org.json.JSONObject

// Verify MFA code
class MFAVerificationManager {
    private val environmentId = "${userConfig.environmentId}"
    private val userId = "${userConfig.userId}"
    
    fun verifyCode(deviceId: String, otp: String, accessToken: String, callback: (Result<Boolean>) -> Unit) {
        val client = OkHttpClient()
        val url = "https://api.pingone.com/v1/environments/\${environmentId}/users/\${userId}/devices/\${deviceId}/otp/check"
        
        val json = JSONObject().apply {
            put("otp", otp)
        }
        
        val requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            json.toString()
        )
        
        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer \${accessToken}")
            .addHeader("Content-Type", "application/json")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }
            
            override fun onResponse(call: Call, response: Response) {
                callback(Result.success(response.isSuccessful))
            }
        })
    }
}`,
      deviceRegistration: `import okhttp3.*
import org.json.JSONObject

// Register new MFA device
class DeviceRegistrationManager {
    private val environmentId = "${userConfig.environmentId}"
    private val userId = "${userConfig.userId}"
    
    fun registerDevice(
        type: String,
        phoneNumber: String? = null,
        email: String? = null,
        accessToken: String,
        callback: (Result<String>) -> Unit
    ) {
        val client = OkHttpClient()
        val url = "https://api.pingone.com/v1/environments/\${environmentId}/users/\${userId}/devices"
        
        val json = JSONObject().apply {
            put("type", type)
            phoneNumber?.let { put("phone", it) }
            email?.let { put("email", it) }
        }
        
        val requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            json.toString()
        )
        
        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer \${accessToken}")
            .addHeader("Content-Type", "application/json")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }
            
            override fun onResponse(call: Call, response: Response) {
                response.body?.string()?.let { body ->
                    try {
                        val json = JSONObject(body)
                        val deviceId = json.getString("id")
                        callback(Result.success(deviceId))
                    } catch (e: Exception) {
                        callback(Result.failure(e))
                    }
                }
            }
        })
    }
}`,
    };
    
    return {
      code: templates[flowStep],
      language: 'kotlin',
      dependencies: flowStep === 'authorization' ? ['com.pingidentity:pingone-android-sdk'] : ['com.squareup.okhttp3:okhttp'],
      description: this.getStepDescription(flowStep, 'Ping SDK Android (Kotlin)'),
    };
  }

  private generateMobileReactNative(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => ReactNativeTemplates.authorization(userConfig),
      workerToken: () => ReactNativeTemplates.workerToken(userConfig),
      deviceSelection: () => ReactNativeTemplates.deviceSelection(userConfig),
      mfaChallenge: () => ReactNativeTemplates.mfaChallenge(userConfig),
      mfaVerification: () => ReactNativeTemplates.mfaVerification(userConfig),
      deviceRegistration: () => ReactNativeTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'typescript',
      dependencies: ['react-native', 'expo-auth-session', 'expo-crypto', '@react-native-async-storage/async-storage'],
      description: this.getStepDescription(flowStep, 'React Native'),
    };
  }

  private generateMobileFlutter(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    const stepMap: Record<FlowStep, () => string> = {
      authorization: () => FlutterTemplates.authorization(userConfig),
      workerToken: () => FlutterTemplates.workerToken(userConfig),
      deviceSelection: () => FlutterTemplates.deviceSelection(userConfig),
      mfaChallenge: () => FlutterTemplates.mfaChallenge(userConfig),
      mfaVerification: () => FlutterTemplates.mfaVerification(userConfig),
      deviceRegistration: () => FlutterTemplates.deviceRegistration(userConfig),
    };

    return {
      code: stepMap[flowStep](),
      language: 'dart',
      dependencies: ['http', 'flutter_secure_storage', 'crypto'],
      description: this.getStepDescription(flowStep, 'Flutter'),
    };
  }

  private getStepDescription(step: FlowStep, platform: string): string {
    const descriptions: Record<FlowStep, string> = {
      authorization: `${platform} - OAuth 2.0 Authorization Code Flow with PKCE`,
      workerToken: `${platform} - Get worker token using client credentials`,
      deviceSelection: `${platform} - List and select MFA devices for user`,
      mfaChallenge: `${platform} - Send MFA challenge code to device`,
      mfaVerification: `${platform} - Verify MFA code entered by user`,
      deviceRegistration: `${platform} - Register new MFA device for user`,
    };
    return descriptions[step];
  }



  private generatePlaceholder(config: CodeGenerationConfig): GeneratedCode {
    return {
      code: `// ${config.category} - ${config.codeType} - ${config.flowStep}
// 
// This code template is coming soon!
// 
// Configuration:
// - Environment ID: ${config.config.environmentId}
// - Client ID: ${config.config.clientId}
// - Redirect URI: ${config.config.redirectUri}
// - User ID: ${config.config.userId}

console.log('Template not yet implemented for ${config.codeType}');`,
      language: 'typescript',
      dependencies: [],
      description: `Template for ${config.codeType} - ${config.flowStep} (Coming Soon)`,
      notes: 'This template is under development',
    };
  }
}
