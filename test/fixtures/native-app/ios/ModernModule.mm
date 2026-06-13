#import "ModernModule.h"

@implementation ModernModule
RCT_EXPORT_MODULE();

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule {
  // New Architecture path present
}
#endif
@end
