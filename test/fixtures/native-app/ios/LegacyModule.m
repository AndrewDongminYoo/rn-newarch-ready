#import <React/RCTBridgeModule.h>

@interface LegacyModule : NSObject <RCTBridgeModule>
@end

@implementation LegacyModule
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(doThing:(NSString *)value) {
  // legacy bridge method
}
@end
